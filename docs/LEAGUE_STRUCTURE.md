# League Structure — La Liga Qanvit

## 1. Filosofía: la metáfora deportiva

La Liga Qanvit está diseñada para que cualquier fundador entienda su posición en 3 segundos:

> "Estás en **Seed Robotics**, eres el **#4 nacional** de tu División-Vertical y **#27 nacional** cruzado."

Inspiración: NBA (Eastern/Western + Divisions), La Liga (1ª/2ª/3ª), Champions (grupos + KO). Mezclamos los modelos para obtener algo propio:
- **La Liga** es la competición nacional entera.
- **División** es la categoría de madurez (ej. *Seed*).
- **Vertical** es la categoría sectorial (ej. *Robotics*).
- La **posición oficial** es siempre la combinación única División × Vertical.

## 2. Las 4 Divisiones

Nombradas para que resuenen con el lenguaje startup **y** el lenguaje deportivo:

| Código | Nombre display | Icono | Significado |
|---|---|---|---|
| `ideation` | **Ideation League** | 🥚 | Pre-producto o producto muy temprano. Sin tracción comercial. |
| `seed` | **Seed League** | 🌱 | Producto en mercado, clientes iniciales, primeros €. |
| `growth` | **Growth League** | 🚀 | Modelo validado, escalando comercialmente. |
| `elite` | **Elite League** | 👑 | Líder o co-líder de su vertical. |

### Criterios de pertenencia a cada División

Las señales siguientes son **heurísticas para el LLM**. La asignación final es puramente el score total del evaluador (ver `EVALUATOR_RUBRIC.md`).

**Ideation** (score 0-40):
- Sin MRR o MRR < €2k/mes.
- Prototipo / MVP sin clientes pagando.
- Equipo fundador en construcción.
- Sin ronda o con friends&family.

**Seed** (score 41-60):
- MRR entre €2k — €40k/mes aprox.
- Pilotos firmados, primeras ventas.
- Equipo de 3-10 personas.
- Posible ronda pre-seed o seed cerrada.

**Growth** (score 61-80):
- ARR entre €500k — €10M aprox.
- 10+ clientes con retention medible.
- Equipo 10-50 personas.
- Serie A cerrada o en proceso.

**Elite** (score 81-100):
- ARR > €10M.
- Presencia internacional.
- Serie B+ o rentable.
- Referente en su vertical.

## 3. Las 10 Verticales

Seleccionadas por relevancia en el ecosistema español de parques, clusters y asociaciones (ICP de Qanvit).

| Código | Nombre display | Scope ilustrativo |
|---|---|---|
| `deeptech_ai` | **Deeptech & AI** | Fundamental AI, ML infrastructure, LLMs verticales, ciencia de datos avanzada, cuántica |
| `robotics_automation` | **Robotics & Automation** | Robots industriales, cobots, automatización logística, visión artificial industrial, RPA avanzado |
| `mobility` | **Mobility** | EV, movilidad compartida, logística última milla, transporte, software automotriz |
| `energy_cleantech` | **Energy & Cleantech** | Renovables, almacenamiento, eficiencia, hidrógeno, captura de carbono, grid management |
| `agrifood` | **AgriFood** | Agtech, foodtech, proteína alternativa, trazabilidad, riego inteligente, supply chain alimentario |
| `healthtech_medtech` | **HealthTech & MedTech** | Diagnóstico, dispositivos médicos, digital health, biotech, telemedicina |
| `industrial_manufacturing` | **Industrial & Manufacturing** | Industry 4.0, IoT industrial, mantenimiento predictivo, fabricación aditiva, procurement industrial |
| `space_aerospace` | **Space & Aerospace** | NewSpace, satélites, observación Tierra, propulsión, drones, aviación |
| `materials_chemistry` | **Materials & Chemistry** | Nuevos materiales, polímeros, química verde, nanotecnología, bioplásticos |
| `cybersecurity` | **Cybersecurity** | Seguridad ofensiva/defensiva, threat intel, criptografía aplicada, identidad digital |

### Reglas de asignación

- Una startup tiene **exactamente una vertical** (la primaria). En V2 podrá tener hasta 2.
- Si el deck toca varias, el LLM elige la que **domina el narrative**.
- Si el LLM detecta ambigüedad fuerte (confidence < 0.55), la startup va a cola de revisión admin antes de publicar.

## 4. Rankings

Cada startup tiene tres rankings simultáneos, calculados sobre `current_score`:

### 4.1 Rank Nacional cruzado
Posición global entre **todas las startups públicas** de la liga. Útil para titulares ("Top 50 nacional de La Liga Qanvit 2026").

### 4.2 Rank por División
Posición dentro de su División (Seed, Growth...). Útil para comparación por madurez.

### 4.3 Rank División × Vertical (oficial)
Posición dentro de la combinación única (ej. *Seed Robotics*). Es la **posición oficial** que se muestra en el perfil y en la carta compartible.

### 4.4 Visualización del leaderboard público

```
  NAVBAR { Liga · Divisiones · Verticales · Ficha tu startup · Ecosistema }
  ┌────────────────────────────────────────────────────────────────────┐
  │  [ filtros: División ▼ · Vertical ▼ · Región ▼ · Este mes ▼ ]     │
  │                                                                    │
  │   #1  [logo]  NAMESTARTUP        Growth · Robotics     Score 87   │
  │   #2  [logo]  NAMESTARTUP        Growth · Mobility     Score 84   │
  │   #3  [logo]  NAMESTARTUP        Seed   · AgriFood     Score 82   │
  │   ...                                                              │
  └────────────────────────────────────────────────────────────────────┘
```

Cuando se aplican filtros, los números de ranking se re-indexan (ej. "Top 10 de Seed Robotics en Andalucía").

## 5. Movilidad (subir y bajar de División)

- Las startups pueden **re-subir deck** tras 7 días desde su última evaluación (rate limit).
- Cada nueva evaluación puede **cambiar su División y Vertical**.
- El histórico de evaluaciones se guarda (tabla `evaluations`) y aparece en su perfil como **timeline** (opcional para la startup hacerlo público).
- Un parque/cluster del ecosistema recibe bonus de puntos si una startup que ellos refirieron **sube de División** (ver `GAMIFICATION.md`).

## 6. "Temporadas" (V1 simple, V2 rich)

**V1**: la liga es continua, sin temporadas. Solo existe el estado actual.

**V2** (roadmap):
- Temporadas semestrales (`2026-H1`, `2026-H2`).
- Al cerrar temporada:
  - Snapshot del ranking → se guarda como "Temporada 2026-H1".
  - Top 3 de cada División × Vertical reciben badge permanente en su perfil.
  - Reset de ciertos puntos del ecosistema para incentivar actividad continua.

## 7. Edge cases

| Caso | Comportamiento |
|---|---|
| Deck en inglés de startup internacional que aplica sin ser española | Aceptar pero marcar `location_region = 'international'`. Filtro por defecto excluye del ranking España; aparece en ranking global V2. |
| Startup con pivot mayor sube deck nuevo de otra vertical | Se re-evalúa. Su División y Vertical pueden cambiar. El histórico queda en su perfil como "Antes: Seed AgriFood → Ahora: Seed Industrial". |
| Deck muy breve (< 3 páginas, sin señal) | `classification_confidence < 0.5` → status=`error`, admin revisa. Email a la startup pidiendo deck más completo. |
| Scoring sospechosamente alto en Ideation (ej. 75) | El sistema loggea flag para revisión manual. La startup queda en su División según umbrales. |

## 8. Semántica para la UI

Las copies oficiales para hablar de posición (en español):

- "Estás en **Seed Robotics**" (División + Vertical).
- "**#4** en Seed Robotics" (posición División × Vertical).
- "**#27** en la Seed League nacional" (posición División).
- "**#142** en La Liga Qanvit" (posición nacional cruzada).
- "Has **subido de División**" / "Has **bajado de División**" (tras re-evaluación).

Botón principal de CTA: **"Ficha tu startup"** (no "Subir deck"). Refuerza metáfora deportiva.
