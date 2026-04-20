# Pipeline de evaluación — La Liga Qanvit

> Documentación viva del pipeline asíncrono que convierte un PDF en un registro completo en `evaluations`. Complementa `ARCHITECTURE.md` y `EVALUATOR_RUBRIC.md`.

## 1. Decisiones de stack

| Componente | Elección | Motivo |
|---|---|---|
| **Runtime** | Supabase Edge Function (Deno) | Corre cerca de la DB, se invoca directo por trigger pg_net, sin costes de Vercel Pro para `maxDuration`. |
| **PDF extraction** | `unpdf` (esm.sh) | Funciona nativo en Deno, zero-deps, extrae texto por página. |
| **Embeddings** | OpenAI `text-embedding-3-small` (1536 dims) | Barato, estándar, bien soportado por pgvector. |
| **Clasificador** | Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) | Rápido, barato, suficiente para clasificación estructurada. |
| **Evaluador profundo** | Claude Opus 4.7 (`claude-opus-4-7`) | Máxima calidad para el core del producto. |
| **Structured output** | `tool_use` + validación Zod (compartido desde Node/Deno) | JSON garantizado, tipado fuerte, versionable. |
| **Email notification** | Resend | SDK limpio, funciona en Deno vía esm.sh. |
| **Retry policy** | Exponential backoff + fallback Haiku + admin queue | Max completion, calidad degradada explícita, cero pérdidas silenciosas. |

## 2. Flujo end-to-end

```
┌─────────────────────────────┐
│  app/api/decks/upload       │   Next.js Route Handler (Node)
│  POST { file, startup_id }  │
└─────────────┬───────────────┘
              │ 1. valida (PDF, ≤20MB)
              │ 2. sube a Supabase Storage: decks/{startup_id}/{deck_id}.pdf
              │ 3. INSERT decks(status='pending', storage_path, ...)
              ▼
┌─────────────────────────────┐
│  Trigger: trg_deck_pipeline │   Postgres (pg_net)
│  on INSERT decks            │
└─────────────┬───────────────┘
              │ pg_net.http_post → edge function
              ▼
┌──────────────────────────────────────────────────────┐
│  Edge Function: evaluator-pipeline                   │   Deno
│  ─────────────────────────────────────────────       │
│  STEP 1  UPDATE decks SET status='processing'        │
│  STEP 2  Download PDF from Storage (signed URL)      │
│  STEP 3  Extract text (unpdf)                        │
│  STEP 4  Detect language + update decks.raw_text     │
│  STEP 5  Chunk text (800 tokens, overlap 100)        │
│  STEP 6  Embed chunks (OpenAI batch)                 │
│  STEP 7  INSERT deck_chunks (batch)                  │
│  STEP 8  Classify (Haiku + tool_use + Zod validate)  │
│  STEP 9  Evaluate (Opus + tool_use + Zod validate)   │
│          with retry/fallback (ver §4)                │
│  STEP 10 Compute score_total with division weights   │
│  STEP 11 INSERT evaluations                          │
│          → trigger sync_startup_current_eval         │
│          → refresh materialized view                 │
│  STEP 12 UPDATE decks SET status='evaluated'         │
│  STEP 13 Send email notification (Resend)            │
└──────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────┐
│  Startup recibe email +     │
│  ve resultado en /resultado │
└─────────────────────────────┘
```

## 3. Chunking strategy

- Tamaño objetivo: **800 tokens** por chunk.
- Overlap: **100 tokens** para preservar contexto en fronteras.
- Aproximación en caracteres (Deno sin tiktoken): **~3200 chars por chunk, overlap 400 chars**.
- Split preferente en límites de párrafo, luego frase, luego carácter duro.
- Metadata por chunk: `{ page_hint: number | null, position: number }`.

## 4. Política de retry/fallback

El core del producto depende de que el evaluador devuelva JSON válido conforme al schema Zod. Política completa:

```
ATTEMPT 1: Opus 4.7
  ├─ éxito → persist evaluation
  ├─ JSON inválido → ATTEMPT 2 (mensaje correctivo)
  ├─ rate limit (429) → esperar 2s → ATTEMPT 2
  └─ otro error → esperar 2s → ATTEMPT 2

ATTEMPT 2: Opus 4.7 (esperar 4s si fue por error transitorio)
  ├─ éxito → persist evaluation
  └─ fallo → ATTEMPT 3 (esperar 8s)

ATTEMPT 3: Opus 4.7
  ├─ éxito → persist evaluation
  └─ fallo → FALLBACK

FALLBACK: Haiku 4.5
  ├─ éxito → persist evaluation CON flag `degraded_mode=true`
  │         y `evaluator_model='claude-haiku-4-5-20251001'`
  │         → email notifica resultado normal (startup no ve el flag)
  │         → admin ve flag en /admin/evaluations
  └─ fallo → UPDATE decks SET status='error', error_message=...
            → admin revisa en /admin/deck-errors
            → email a la startup: "Hemos tenido un problema técnico. Lo estamos revisando."
```

Backoff: `wait_ms = base * 2^attempt` con base=2000, jitter ±20%.

### 4.1 Errores tratados como transitorios (reintentar)
- `429 rate_limit_error`
- `529 overloaded_error`
- `500 internal_server_error` de Anthropic
- Timeout de red

### 4.2 Errores tratados como permanentes (saltan a fallback de inmediato)
- `400 invalid_request_error` (prompt corrupto, deck ilegible)
- `401 authentication_error` (bug de secrets → alerta a admin)
- Parse error de Zod tras mensaje correctivo

## 5. Mensaje correctivo para JSON inválido

Cuando Zod rechaza la respuesta, se añade este mensaje y se reintenta dentro del mismo attempt:

```
Tu respuesta anterior no cumple el schema. Errores encontrados:
{ZOD_ERRORS}

Devuelve de nuevo la tool_use con los campos correctos. Respeta los tipos y los enums exactamente.
```

Solo 1 corrección por attempt. Si tras corregir sigue mal, cuenta como attempt fallido y pasa al siguiente.

## 6. Idempotencia

- Clave única en `evaluations(deck_id, prompt_version, rubric_version)`.
- Si el pipeline se re-dispara para un deck ya evaluado con la misma versión, el INSERT falla y se loguea un noop.
- Para forzar re-evaluación, admin cambia manualmente `prompt_version` a `vN+1` o elimina el registro.

## 7. Observabilidad

Cada evaluación persiste en `evaluations`:
- `classifier_model`, `evaluator_model`
- `tokens_input`, `tokens_output`
- `cost_estimate_usd` (calculado en base a precios públicos de cada modelo)
- `latency_ms` (total end-to-end del pipeline)
- `prompt_version`, `rubric_version`

Logs de la edge function se ven en Supabase Dashboard → Functions → Logs. Errores se escriben también a Sentry (client + server + edge).

## 8. Coste estimado por evaluación

Orden de magnitud (ajustar con datos reales tras launch):

| Concepto | Tokens/coste aprox. |
|---|---|
| Embeddings OpenAI | 15k tokens · $0.00002/1k = **~$0.0003** |
| Clasificación Haiku | 10k in + 500 out ≈ **~$0.01** |
| Evaluación Opus | 15k in + 3k out ≈ **~$0.5** |
| **Total por deck** | **~$0.51** |

Cachear por hash del PDF elimina re-evaluaciones idénticas (V1.5+).

## 9. Cómo probar localmente

```bash
# Levantar Supabase local
npx supabase start

# Aplicar migrations
npx supabase db reset

# Servir funciones localmente
npx supabase functions serve evaluator-pipeline --env-file .env.local

# En otra terminal: simular invocación
curl -X POST http://localhost:54321/functions/v1/evaluator-pipeline \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"deck_id":"<uuid-de-deck-subido>"}'

# Ver logs en tiempo real
npx supabase functions logs evaluator-pipeline
```

## 10. Troubleshooting común

| Síntoma | Causa probable | Fix |
|---|---|---|
| `status='error'` con mensaje "PDF extraction returned empty text" | Deck escaneado sin OCR | V1: marcar error, pedir a startup subir PDF con texto. V2: OCR con Tesseract. |
| Deck se queda en `status='processing'` > 5 min | Edge function crash silencioso | Cron job que marca como error tras timeout, revisa logs. |
| `classification_confidence < 0.5` repetidamente | Deck ambiguo, mezcla de verticales | Flag para admin revisión manual. |
| Score Opus ≠ score Haiku fallback (>20 puntos diff) | Evaluadores con calibración distinta | V1.5: re-correr Opus cuando fallback viejo se detecta. |
| Embeddings insert tarda mucho | pgvector index no optimizado | Revisar `lists` en ivfflat; reindex si el dataset crece >10k chunks. |

## 11. Versionado del pipeline

- `prompt_version` sube cuando el texto del prompt cambia de forma material.
- `rubric_version` sube cuando los pesos o dimensiones cambian.
- Al subir versión, las evaluaciones viejas **no se re-corren automáticamente**. Admin decide cuándo y qué deck re-evaluar.
- Las startups ven siempre su última evaluación; el histórico queda en su perfil.
