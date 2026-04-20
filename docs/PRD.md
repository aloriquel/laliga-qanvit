# PRD — La Liga Qanvit

## 1. Problema

El ecosistema de innovación español tiene un problema de **descubrimiento y clasificación de startups**:
- Las startups no tienen un canal unificado para mostrarse ante parques, clusters y asociaciones de innovación.
- Los parques/clusters/asociaciones no tienen una forma estructurada, gamificada y actualizada de mapear su ecosistema local y nacional.
- Qanvit necesita un flywheel para capturar datos primarios de startups (decks) que alimenten su plataforma de innovación abierta.

Los mecanismos actuales (Dealroom, Crunchbase, F6S, Startupxplore) son databases pasivas y de pago. Ninguno propone un **game layer** que convierta el acto de subir un deck en un evento público con incentivo inmediato para la startup.

## 2. Propuesta

**La Liga Qanvit** es una liga nacional gamificada de startups:

- La startup sube su deck en 2 minutos.
- Un evaluador (LLM entrenado con rubrics construidos por expertos) genera feedback estructurado, asigna la startup a una **División** (Ideation / Seed / Growth / Elite) y una **Vertical** (10 categorías), y le da una posición en el ranking nacional y el ranking División+Vertical.
- Parques, clusters y asociaciones acceden al ecosistema ganando puntos mediante contribuciones (referir startups, validar scoring, aportar verticales). Los puntos desbloquean tiers de acceso a los datos.
- Qanvit captura el dataset completo: decks, extracciones, embeddings, scoring, feedback.

## 3. Audiencias (ICP)

### 3.1 Startup (usuario final del producto)
- Startups españolas en cualquier fase (pre-seed a Serie B+).
- Motivación primaria: **visibilidad + feedback gratis y accionable**.
- Motivación secundaria: entrar en el radar de parques, clusters, inversores del ecosistema.

### 3.2 Ecosistema (cliente indirecto / B2B layer)
- Parques científicos y tecnológicos (APTE y asociados).
- Clusters sectoriales (Mobility, Robotics, Energy, etc.).
- Asociaciones de innovación regionales.
- Motivación: mapear su territorio, detectar startups relevantes, justificar KPIs internos de dinamización.

### 3.3 Qanvit (owner)
- Captura de deal flow propio.
- Generación de dataset vectorizado para los otros agentes (Discovering, Coordinating).
- Posicionamiento de marca en el ecosistema español.

## 4. Scope del MVP V1

**Incluido:**
- [x] Landing pública con narrativa "La Liga Qanvit" y leaderboard en vivo.
- [x] Signup startup (magic link + Google OAuth) y perfil editable.
- [x] Upload de deck (PDF, máx 20MB) en flujo `/play`.
- [x] Pipeline de evaluación asíncrono: extracción → chunking → embeddings → rubric LLM → scoring → feedback.
- [x] Asignación automática de División y Vertical.
- [x] Feedback estructurado visible para la startup (7 dimensiones + resumen + next actions).
- [x] Leaderboard público: nacional, por División, por Vertical, por combinación División+Vertical.
- [x] Perfil público de startup: logo, one-liner, posición, score, vertical, división (sin exponer deck).
- [x] Signup ecosistema con verificación manual (admin aprueba).
- [x] Dashboard ecosistema: filtros avanzados, exports, alertas por nueva startup en su vertical/región.
- [x] Sistema de puntos: log de contribuciones, tiers (Rookie / Pro / Elite), gating de funcionalidades por tier.
- [x] Panel admin Qanvit: moderación, override manual de clasificación, métricas globales.

**Excluido de V1 (v2+):**
- Revisión experta humana (solo LLM en V1).
- API pública para terceros.
- Integración con Notion/Slack/email programático de parques.
- Monetización directa (subscriptions para ecosistema). V1 es freemium con tiers por puntos.
- Matchmaking activo (invitar startups a programas). Será parte del agente Coordinating de Qanvit.

## 5. Flujos clave

### 5.1 Flujo Startup (el jugador)
1. Aterriza en `laliga.qanvit.com`, ve el leaderboard en vivo.
2. CTA "Ficha tu startup" → onboarding en 3 pasos:
   - Paso 1: datos básicos (nombre, URL, one-liner).
   - Paso 2: upload deck PDF.
   - Paso 3: consent explícito para evaluación + uso interno del deck por Qanvit (con opción de revocar).
3. Pantalla de "En evaluación" (job asíncrono, normalmente 30-60s con Claude).
4. Resultado:
   - **Posición oficial**: "Seed Robotics — #4 nacional / #8 global Seed".
   - **Score total** (0-100).
   - **Feedback por dimensión** (7 tarjetas expandibles).
   - **Next actions** (3-5 acciones recomendadas).
   - Opción de compartir su carta de clasificación en redes (imagen OG autogenerada).
5. Dashboard startup: ver evolución, subir nueva versión del deck (re-evaluación), ver quién del ecosistema ha visto su perfil.

### 5.2 Flujo Ecosistema (el scout)
1. Aplica desde `/ecosistema` con datos de su organización (parque/cluster/asociación).
2. Admin Qanvit aprueba (anti-abuso).
3. Entra al dashboard:
   - Leaderboard con filtros (vertical, división, región, fecha de entrada).
   - Fichas de startup detalladas (lo que tenga permitido según tier).
   - Tracker de sus puntos acumulados.
   - Link de referral para aumentar puntos.
4. Contribuciones que dan puntos:
   - Referir startup que complete onboarding: **100 pts**.
   - Startup referida entra top 10 de su División+Vertical: **500 pts** extra.
   - Validar feedback de una evaluación (thumb up/down con comentario): **25 pts**.
   - Proponer nueva vertical o subcategoría aceptada por admin: **1000 pts**.
5. Tiers desbloquean features (ver `docs/GAMIFICATION.md`).

### 5.3 Flujo Admin Qanvit (operador)
1. Panel interno con:
   - Cola de decks pendientes de evaluar (si falla el pipeline).
   - Cola de aplicaciones de ecosistema pendientes de aprobar.
   - Override manual de División/Vertical cuando sea necesario.
   - Métricas globales: decks totales, decks por vertical, distribución de scores, conversión del funnel.
   - Export de dataset para trabajar en los otros agentes de Qanvit.

## 6. Métricas de éxito

### Producto
- **Decks subidos**: 500 en primeros 3 meses, 2000 en 6 meses, 10k en 12 meses.
- **Completion rate onboarding**: >70% (de signup a deck evaluado).
- **NPS feedback**: >40 (medido post-evaluación).
- **Ecosistemas activos**: 30 organizaciones (parques/clusters) en 6 meses.

### Tracción comercial (indirecta)
- Deals generados para Qanvit main platform a partir de La Liga: 5 pilotos firmados en primeros 6 meses.
- Menciones de marca en medios de innovación españoles: >20 en primeros 6 meses.

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Startups no confían en subir su deck | Consent explícito, deck nunca expuesto públicamente, opción de borrar cuenta y dato. Transparencia total en FAQ. |
| El evaluador LLM clasifica mal | V1 siempre tiene opción "impugnar clasificación" → cola admin. V2 añade experto humano. |
| Parques/clusters no se activan | Outreach dirigido al ICP en launch (APTE, clusters sectoriales conocidos). Gamificación real (tiers con valor). |
| Sesgo del LLM contra startups pre-producto | Rubric con pesos diferentes por fase (ver `docs/EVALUATOR_RUBRIC.md`). Pre-evaluación determina fase antes de aplicar pesos. |
| Costes de LLM escalan mal | Cache de evaluaciones por hash del deck. Uso de Haiku para tareas rápidas, Opus solo para evaluación profunda. Rate limiting por startup (1 evaluación por semana). |
| Copia por competidores (Dealroom, F6S) | La moat es el dataset vectorizado + la ligazón con el resto de agentes Qanvit. La liga en sí puede ser copiada, pero no el ecosistema completo. |

## 8. Legal y consentimiento

- GDPR compliance desde el día 1: base legal = consentimiento explícito + interés legítimo.
- Consent granular: (a) evaluar el deck, (b) mostrar posición pública, (c) usar deck internamente para mejorar Qanvit.
- Derecho de supresión implementado (borrar cuenta borra deck, chunks, embeddings).
- Política de privacidad y términos en `/legal/*` visibles desde el footer.
- DPA estándar con Supabase y Anthropic (ambos tienen opciones EU/zero-retention).

## 9. Roadmap post-V1

**V1.5** (mes 3-4):
- Revisión experta humana opcional (pagada o por invitación).
- Badges públicos ("Top 10 Seed Mobility 2026").
- Challenges patrocinados por parques/clusters.

**V2** (mes 6+):
- API pública para el ecosistema.
- Matchmaking activo (Qanvit Coordinating agent).
- Internacionalización (Portugal, LATAM).
- Certificación Qanvit para startups top (pasar a ser data source oficial).
