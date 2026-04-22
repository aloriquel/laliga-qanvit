# Gamification — El juego del ecosistema

> El ecosistema (parques científicos, clusters, asociaciones de innovación) **no paga** por acceder a La Liga Qanvit en V1. **Contribuye** y gana acceso.

## 1. Filosofía

Tres principios:
1. **Pagas con contribución, no con dinero** (en V1). Parques/clusters aportan descubrimiento, validación, referral. A cambio desbloquean datos.
2. **Más contribuyes, más ves**. Los tiers se ganan, no se compran.
3. **El abuso no se paga**. Revocar puntos es inmediato si se detecta mala fe.

## 2. Eventos que dan puntos

| Evento | Puntos | Condición |
|---|---:|---|
| Startup referida completa onboarding (deck evaluado) | **+100** | Una vez por startup/organización. Se usa `referral_code`. |
| Startup referida entra en Top 10 de su División × Vertical | **+500** | Trigger al recalcular ranking tras evaluación. |
| Startup referida sube de División (Ideation→Seed, etc.) | **+250** | Bonus por retención activa y crecimiento. |
| Validar feedback de una evaluación (thumb ±  + comentario) | **+25** | Máximo 1 por evaluación por organización. |
| Proponer nueva vertical o subcategoría aceptada por admin | **+1000** | Requiere validación humana. |
| Reporte de abuso o deck fraudulento confirmado | **+200** | Para proteger la integridad del dataset. |

> **Nota**: Los votos de startups (up/down) **no dan puntos**. Son señales de scouting, no mecánicas de puntuación — evita optimización artificial.

### Eventos que restan puntos

| Evento | Puntos | Motivo |
|---|---:|---|
| Referral fraudulento detectado | **−500** | Startups falsas o duplicadas con intención de puntuar. |
| Validaciones con patrón sospechoso (spam, bot) | **−100** por validación | Automático + revisión admin. |
| Uso de datos fuera del scope permitido | **−1000** | Escalado legal adicional. |

## 3. Tiers

| Tier | Puntos acumulados | Icono |
|---|---:|---|
| **Rookie** | 0 — 1,000 | 🥉 |
| **Pro** | 1,001 — 5,000 | 🥈 |
| **Elite** | 5,001+ | 🥇 |

### Qué desbloquea cada tier

| Feature | Rookie | Pro | Elite |
|---|:---:|:---:|:---:|
| Ver leaderboard público | ✅ | ✅ | ✅ |
| Filtros básicos (División, Vertical) | ✅ | ✅ | ✅ |
| Perfil público de la startup | ✅ | ✅ | ✅ |
| Votar startups (up/down) | ✅ (×1) | ✅ (×2) | ✅ (×3) |
| Alertas email: nueva startup en tu vertical | 1 vertical | 3 verticales | 10 verticales |
| Filtros avanzados | ❌ | ✅ | ✅ |
| Export CSV del leaderboard | ❌ | 100 rows/mes | Ilimitado |
| Ver resumen LLM del deck | ❌ | ✅ | ✅ |
| Ver evolución histórica (timeline) | ❌ | ✅ | ✅ |
| Razón requerida en votos down | No | Sí | Sí |
| Early access a startups nuevas (antes del digest) | ❌ | ❌ | ✅ |
| Badge "Elite Scouter" en perfil org | ❌ | ❌ | ✅ |
| Dataset export mensual (snapshot completo) | ❌ | ❌ | 1/mes |
| Solicitar sesión con equipo Qanvit | ❌ | ❌ | ✅ |

**Notas clave**:
- El **deck completo nunca se expone** al ecosistema. Solo metadata, score, summary LLM y next actions.
- **Elite ya no desbloquea contacto directo con founders**. Para gestionar relaciones con startups, el canal es app.qanvit.com.
- El **peso del voto** (×1/×2/×3) afecta `startup_momentum` pero no da puntos al votante.

## 4. Cómo se calcula el tier

Vista `ecosystem_totals` agrega los puntos del log en vivo y devuelve:
- `total_points`
- `tier` (computado con CASE WHEN)

El frontend hace feature gating leyendo el tier del usuario autenticado con rol `ecosystem`.

## 5. Onboarding del ecosistema

1. Aplicación en `/ecosistema/aplicar`:
   - Nombre de la organización.
   - Tipo (parque / cluster / asociación / otro).
   - Web.
   - Breve descripción.
   - Email institucional (validación de dominio).
2. Admin Qanvit recibe notificación en `/admin/ecosystem-applications`.
3. Admin aprueba → se crea `ecosystem_organizations` con `is_verified=true` y `referral_code` único generado.
4. Usuario recibe email de bienvenida con:
   - Su `referral_code` único.
   - Guía rápida de cómo ganar puntos.
   - Link al dashboard.

## 6. Referral tracking

Cada organización tiene un `referral_code` único (p.ej. `APTE-2026-MDR`). Al compartirlo con startups:

- URL: `laliga.qanvit.com/play?ref=APTE-2026-MDR`
- Al completar onboarding, `startups` guarda `referred_by_org_id`.
- Evento `startup_referred_signup` se inserta en `ecosystem_points_log` con `+100`.
- Si luego esa startup entra top 10 → `startup_referred_top10` con `+500`.
- Si sube de División → `startup_referred_phase_up` con `+250`.

## 7. Anti-abuso

Reglas automáticas:
- **Unique email domain per startup**: no se puede referir 50 startups desde dominios de email Gmail personales del mismo cluster.
- **Detección de duplicados**: si dos decks tienen similitud de embedding > 0.95, se marca y admin revisa.
- **Cap diario**: máximo 20 referrals por organización por día (protege de bots).
- **Review manual**: cualquier evento > 500 puntos dispara una tarea de revisión para admin antes de consolidar.
- **Votos**: límite de 5 votos up por semana por org. No se puede votar la propia referida. 1 voto por startup por 90 días.

## 8. Métricas de éxito de la gamificación

- % de organizaciones **Pro+** (Pro + Elite) sobre total: objetivo >30% en 6 meses.
- Ratio startups referidas / startup total: objetivo >40%.
- Activación ecosistema (org que ha ganado al menos 1 punto en los últimos 30 días): objetivo >60%.
- Scouting Eye promedio del ecosistema: objetivo >55% de accuracy_rate entre orgs con ≥5 votos.

## 9. Copy para el dashboard ecosistema (referencia)

```
Dashboard / Tu ecosistema

Tus puntos:       🥈 Pro · 2,340 pts
Siguiente tier:   🥇 Elite · faltan 2,661 pts
Scouting Eye:     72% · 18/25 aciertos

─────────────────────────────────
Cómo ganar más puntos:
· Refiere startups con tu código: APTE-2026-MDR
· Valida feedback de startups (+25 pts cada una)
· Propón una vertical nueva si detectas un hueco

[ Copiar link referral ]
─────────────────────────────────
Para lanzar retos de innovación abierta → app.qanvit.com
─────────────────────────────────
```
