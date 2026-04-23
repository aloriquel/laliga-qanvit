# Evaluator Rubric — La Liga Qanvit

> Este es el **core intelectual del producto**. El rubric y los prompts de este archivo determinan qué feedback recibe la startup y en qué División y Vertical se sitúa.

## 1. Principios del evaluador

1. **Evidencia-first**. Toda afirmación del evaluador debe citar explícitamente un fragmento del deck.
2. **Fase antes que todo**. Aplicar pesos equivocados a una startup en fase equivocada produce feedback injusto. Primero clasificar fase, luego evaluar.
3. **Constructivo y accionable**. Cada debilidad detectada → una next action concreta.
4. **Calibrado contra realidad**. La rubric y los scores deben ser coherentes con lo que un VC o un director de innovación de un parque consideraría "bien" en cada fase.
5. **Versionado**. Cada evaluación guarda `prompt_version` y `rubric_version` para reproducibilidad.

## 2. Pipeline de evaluación (dos pasos)

### Paso A — Clasificación rápida (Claude Haiku 4.5)

Input: `raw_text` del deck.
Output (forzado con tool_use):

```json
{
  "detected_phase": "ideation" | "seed" | "growth" | "elite",
  "phase_confidence": 0.0-1.0,
  "phase_signals": [
    "quote 1 que evidencia la fase",
    "quote 2..."
  ],
  "detected_vertical": "deeptech_ai" | "robotics_automation" | ...,
  "vertical_confidence": 0.0-1.0,
  "vertical_signals": ["quote 1", "quote 2"],
  "language": "es" | "en" | "other"
}
```

### Paso B — Evaluación profunda (Claude Opus 4.7)

Input: `raw_text` + clasificación del paso A + pesos correspondientes a la fase detectada.
Output (forzado con tool_use):

```json
{
  "scores": {
    "problem": 0-100,
    "market": 0-100,
    "solution": 0-100,
    "team": 0-100,
    "traction": 0-100,
    "business_model": 0-100,
    "gtm": 0-100
  },
  "score_total": 0-100,
  "feedback": {
    "problem": {
      "score": 0-100,
      "strengths": ["...", "..."],
      "weaknesses": ["...", "..."],
      "evidence_quotes": ["...", "..."]
    },
    "...": "..."
  },
  "summary": "2-3 frases que resumen el deck y posicionamiento",
  "next_actions": [
    "acción concreta 1",
    "acción concreta 2",
    "acción concreta 3"
  ]
}
```

## 3. Las 7 dimensiones evaluadas

### D1. Problem Severity
**Pregunta clave**: ¿Qué dolor resuelve? ¿Cómo de agudo es?

**Señales altas (80-100)**:
- Problema cuantificado (coste en €, tiempo perdido, riesgo).
- Alternativas actuales explicadas y mostradas como insuficientes.
- Evidencia de urgencia (regulatoria, de mercado, tecnológica).

**Señales bajas (0-40)**:
- Problema vago, "mejorar la experiencia" sin métrica.
- Sin alternativas analizadas.
- Problema no obviamente doloroso.

### D2. Market Size & Timing
**Pregunta clave**: ¿Cómo de grande es la oportunidad? ¿Por qué ahora?

**Señales altas**:
- TAM/SAM/SOM con fuente y lógica bottom-up.
- Trigger de timing claro (ley, tecnología madura, cambio cultural).
- Segmento inicial bien delimitado.

**Señales bajas**:
- "El mercado global de X es 500B" sin desglose.
- Sin "why now".
- Segmento inicial inexistente o inmenso.

### D3. Solution Differentiation & Moat
**Pregunta clave**: ¿Por qué esta solución gana? ¿Qué defiende del competidor?

**Señales altas**:
- IP, tecnología propia, datos propios, red propia, efectos de red.
- Diferencia técnica explicada y verificable.
- Benchmarks contra alternativas.

**Señales bajas**:
- "Nuestra app es mejor porque es más fácil".
- Sin moat identificable.
- Solución replicable por cualquier equipo.

### D4. Team Strength & Fit
**Pregunta clave**: ¿Este equipo es el correcto para resolver este problema?

**Señales altas**:
- Founder-market fit (experiencia previa en el dominio).
- Combinación técnica + comercial + operativa cubierta.
- Relevant "unfair advantages" (relaciones, prior exits, patentes).

**Señales bajas**:
- Equipo sin experiencia en el dominio.
- Gaps críticos sin plan para cubrirlos.
- "Stealth" sin nombres.

### D5. Traction & Validation
**Pregunta clave**: ¿Qué evidencia hay de que esto funciona con clientes reales?

**Señales altas**:
- Revenue recurring real (MRR/ARR), MoM growth.
- Pilotos firmados con clientes nombrados y logos.
- Waiting list, LOIs, retention data.

**Señales bajas**:
- "Hablamos con 20 clientes y les gustó".
- Solo proyecciones sin dato real.
- Landing page sin métricas.

### D6. Business Model Viability
**Pregunta clave**: ¿Cómo gana dinero esto y por qué es escalable?

**Señales altas**:
- Pricing explícito con lógica.
- Unit economics (CAC, LTV, margen bruto).
- Camino a rentabilidad articulado.

**Señales bajas**:
- "Monetización: a definir".
- Unit economics obvios pero no calculados.
- Margen insostenible.

### D7. GTM & Go-to-Market Clarity
**Pregunta clave**: ¿Cómo llegan al cliente y por qué ese canal es el correcto?

**Señales altas**:
- Canales específicos con CAC estimado.
- Ciclo de venta mapeado.
- Partnerships concretos, no "exploraremos".

**Señales bajas**:
- "Marketing digital + ventas directas" genérico.
- Sin análisis competitivo.
- Sin sales motion definido.

## 4. Pesos por División

Cada dimensión pesa distinto según la fase detectada en el Paso A.

| Dimensión | Ideation | Seed | Growth | Elite |
|---|---:|---:|---:|---:|
| D1. Problem | 25% | 15% | 10% | 5% |
| D2. Market | 20% | 15% | 15% | 15% |
| D3. Solution | 20% | 20% | 15% | 10% |
| D4. Team | 25% | 20% | 10% | 10% |
| D5. Traction | 0% | 15% | 25% | 30% |
| D6. Business Model | 5% | 10% | 15% | 20% |
| D7. GTM | 5% | 5% | 10% | 10% |
| **Total** | **100%** | **100%** | **100%** | **100%** |

**Lógica detrás de los pesos:**
- En **Ideation** premiamos equipo + problema + solución (hay poco más que evaluar).
- En **Seed** se equilibra; la tracción empieza a pesar.
- En **Growth** la tracción domina, business model y GTM pesan más.
- En **Elite** el modelo de negocio y la tracción son determinantes; se asume que el resto está resuelto.

## 5. Umbrales de Score → División (override del clasificador)

El Paso A clasifica por señales cualitativas. Pero el Paso B produce un score. Si el score final diverge mucho de la fase detectada, se aplica override:

| Score total | División resultante |
|---|---|
| 0 — 40 | Ideation |
| 41 — 60 | Seed |
| 61 — 80 | Growth |
| 81 — 100 | Elite |

**Regla de consistencia**: si `detected_phase` ≠ `score_phase`, se guarda la **score_phase** en `evaluations.assigned_division` pero se loguea en `feedback.notes` el desajuste para revisión humana posterior.

## 6. Prompts canónicos

### 6.1 Prompt del clasificador (v1) — Haiku 4.5

```
Eres un analista senior de startups españolas trabajando para Qanvit.

Tu tarea: leer el texto extraído de un deck y clasificar la startup en:
- Una FASE: ideation | seed | growth | elite
- Una VERTICAL: deeptech_ai | robotics_automation | mobility | energy_cleantech | agrifood | healthtech_medtech | industrial_manufacturing | space_aerospace | materials_chemistry | cybersecurity

DEFINICIONES DE FASE:

- ideation: idea o MVP temprano, sin clientes pagando. El deck habla de visión, prototipo, "primeros pilotos".
- seed: producto en mercado, clientes tempranos. MRR menor a ~€500k ARR. Pilotos firmados, LOIs, primeras ventas.
- growth: modelo validado, escalando. ARR entre ~€500k y ~€10M. Varios clientes, retention demostrada, crecimiento MoM consistente.
- elite: líder o co-líder de su vertical. ARR >€10M, presencia internacional, ronda Serie B+ o profitable.

DEFINICIONES DE VERTICAL: [ver documentación de verticales, tú ya las conoces]

REGLAS:
1. Cita al menos 2 fragmentos exactos del deck que justifiquen cada clasificación (phase_signals y vertical_signals).
2. Si el deck es ambiguo en la vertical, elige la primaria y marca la confianza baja.
3. No inventes tracción ni equipo. Si no lo ves, marca fase ideation.
4. Responde SOLO con la tool_use.

Texto del deck:
---
{{DECK_TEXT}}
---
```

### 6.2 Prompt del evaluador profundo (v1) — Opus 4.7

```
Eres un evaluador senior de startups con 15 años de experiencia en VC e innovación abierta en España.
Acabas de leer un deck de una startup que ha sido clasificada como FASE={{PHASE}} y VERTICAL={{VERTICAL}}.

Tu tarea: evaluar la startup en 7 dimensiones y producir feedback accionable.

LAS 7 DIMENSIONES (cada una 0-100):
1. problem: severidad del problema
2. market: tamaño y timing del mercado
3. solution: diferenciación y moat
4. team: fuerza y fit del equipo
5. traction: validación con clientes reales
6. business_model: viabilidad y escalabilidad
7. gtm: claridad del go-to-market

PESOS PARA ESTA FASE ({{PHASE}}): {{WEIGHTS_JSON}}

REGLAS CRÍTICAS:
- El SCORE TOTAL se calcula como suma ponderada. Tú lo calculas explícitamente.
- Para cada dimensión, da EVIDENCE_QUOTES: 2-3 fragmentos literales del deck que soporten el score.
- Strengths y weaknesses deben ser específicos al deck, no genéricos.
- NEXT_ACTIONS: máximo 5, concretas, ordenadas por impacto. Cada una en 1 línea.
- SUMMARY: 2-3 frases que resuman la startup y su posicionamiento competitivo.
- Responde SIEMPRE en el idioma del deck (si el deck es en español, responde en español).
- Si una dimensión es difícil de evaluar (p.ej. traction en ideation), asigna score bajo pero explica que es esperado para la fase.
- Nunca inventes hechos. Si algo no está en el deck, dilo.

Texto del deck:
---
{{DECK_TEXT}}
---

Responde SOLO con la tool_use estructurada.
```

## 7. Tool schemas (Zod + Anthropic tool_use)

```typescript
// lib/evaluator/schemas.ts

import { z } from "zod";

export const ClassificationResultSchema = z.object({
  detected_phase: z.enum(["ideation", "seed", "growth", "elite"]),
  phase_confidence: z.number().min(0).max(1),
  phase_signals: z.array(z.string()).min(1),
  detected_vertical: z.enum([
    "deeptech_ai",
    "robotics_automation",
    "mobility",
    "energy_cleantech",
    "agrifood",
    "healthtech_medtech",
    "industrial_manufacturing",
    "space_aerospace",
    "materials_chemistry",
    "cybersecurity",
  ]),
  vertical_confidence: z.number().min(0).max(1),
  vertical_signals: z.array(z.string()).min(1),
  language: z.string(),
});

const DimensionFeedbackSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()).min(1),
  weaknesses: z.array(z.string()).min(1),
  evidence_quotes: z.array(z.string()).min(1),
});

export const EvaluationResultSchema = z.object({
  scores: z.object({
    problem: z.number().min(0).max(100),
    market: z.number().min(0).max(100),
    solution: z.number().min(0).max(100),
    team: z.number().min(0).max(100),
    traction: z.number().min(0).max(100),
    business_model: z.number().min(0).max(100),
    gtm: z.number().min(0).max(100),
  }),
  score_total: z.number().min(0).max(100),
  feedback: z.object({
    problem: DimensionFeedbackSchema,
    market: DimensionFeedbackSchema,
    solution: DimensionFeedbackSchema,
    team: DimensionFeedbackSchema,
    traction: DimensionFeedbackSchema,
    business_model: DimensionFeedbackSchema,
    gtm: DimensionFeedbackSchema,
  }),
  summary: z.string(),
  next_actions: z.array(z.string()).min(1).max(5),
});
```

## 8. Fase declarada vs inferida (PROMPT_11)

### 8.1 Fuente primaria de la división

Desde PROMPT_11, la división de una startup la determina su `funding_stage` autodeclarado, **no el evaluador**. El mapeo es:

| funding_stage   | división    |
|---|---|
| pre_seed        | Ideation    |
| seed            | Seed        |
| series_a        | Growth      |
| series_b/c/d+   | Elite       |
| bootstrapped    | Seed (por defecto; ver §8.3) |

El evaluator recibe este contexto en el system prompt y **no reasigna división** basándose en el deck.

### 8.2 Detección de discrepancias

El evaluator SÍ detecta discrepancias graves entre la fase declarada y las señales del deck. Si detecta una, devuelve el campo opcional `funding_stage_discrepancy`:

```json
{
  "suspected_stage": "seed",
  "severity": "high",
  "reasoning": "El deck declara Serie A pero no muestra clientes ni revenue. Sin PMF validado."
}
```

Umbrales para reportar:
- **high**: la divergencia invalida la declaración (ej. declara Series A pero deck es MVP sin clientes).
- **medium**: señales ambiguas o deck incompleto en área clave.
- **low**: discrepancia menor, posible matiz contextual.

Todas las discrepancias se insertan en `admin_evaluator_discrepancies` para revisión manual.

### 8.3 Bootstrapped y override de división

Si una startup declara `bootstrapped` pero ya está en Growth o Elite (el evaluator la subió en iteraciones anteriores), el sistema respeta la división más alta. Esto evita que declarar bootstrapped retrogradar startups con traction probada.

## 9. Calibración y evolución del rubric

- **Golden set**: 20 decks representativos (5 por división) con scoring manual de Arturo + expert panel. Se re-corre al cambiar prompts para detectar drift.
- **Métrica de calidad**: correlación entre score humano y score LLM. Objetivo: Pearson >0.75.
- **Feedback del ecosistema**: thumbs up/down en cada evaluación por parte de parques/clusters alimentan la lista de ejemplos para próximas versiones.
- **Versionado explícito**: cada cambio material al prompt o al rubric = nueva versión. Evaluaciones viejas conservan su versión.
