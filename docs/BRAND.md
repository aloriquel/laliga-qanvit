# Brand — La Liga Qanvit

Guía aplicada a `laliga.qanvit.com`. Mantiene coherencia con Qanvit principal y le da su propio carácter "deportivo".

## 1. Identidad heredada de Qanvit

### 1.1 Paleta oficial

| Nombre | Hex | Uso primario |
|---|---|---|
| `brand-navy` | `#22183a` | Fondo oscuro principal, texto sobre fondos claros |
| `brand-salmon` | `#f4a9aa` | Acento, CTAs secundarios, highlights |
| `brand-lavender` | `#f1e8f4` | Fondos suaves, cards, secciones de respiro |

### 1.2 Paleta extendida (solo para La Liga)

Para marcadores, rankings y estados de División:

| Token | Hex | Uso |
|---|---|---|
| `league-ideation` | `#b8c5d6` | Azul grisáceo pálido (cáscara de huevo) |
| `league-seed` | `#a8d5ba` | Verde salvia (germinación) |
| `league-growth` | `#f4a9aa` | Salmón Qanvit (velocidad, lanzamiento) |
| `league-elite` | `#c8a2c8` | Orquídea (realeza, élite) |
| `rank-gold` | `#d4af37` | Oro (posición #1) |
| `rank-silver` | `#c0c0c0` | Plata (posición #2) |
| `rank-bronze` | `#cd7f32` | Bronce (posición #3) |
| `ink-primary` | `#1a1230` | Texto principal sobre claro (más oscuro que navy) |
| `ink-secondary` | `#6b5b8a` | Texto secundario, metadatos |
| `surface-card` | `#ffffff` | Superficie de cards sobre lavender |
| `border-soft` | `#e5d8ea` | Bordes sutiles |

## 2. Tipografía

### 2.1 Familias

| Uso | Fuente | Pesos cargados |
|---|---|---|
| Headings, números grandes (rankings) | **Sora** | 400, 600, 700, 800 |
| Cuerpo, UI, párrafos | **Open Sans** | 400, 500, 600, 700 |
| Mono (código, IDs, scores técnicos) | **JetBrains Mono** | 400, 500 |

Cargar via `next/font`:
```ts
import { Sora, Open_Sans, JetBrains_Mono } from "next/font/google";

export const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
export const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans", display: "swap" });
export const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
```

### 2.2 Escala

| Token | Tamaño | Uso |
|---|---|---|
| `text-hero` | 64–80px (responsive) | Hero de landing, score display |
| `text-h1` | 48px | Títulos de página |
| `text-h2` | 36px | Secciones |
| `text-h3` | 24px | Sub-secciones |
| `text-body` | 16px | Cuerpo |
| `text-small` | 14px | Metadata, captions |
| `text-mono` | 14px | Rankings, IDs |

## 3. El isotipo `{ }`

Las llaves curly son el sello de Qanvit. En La Liga se usan así:

- **Header**: siempre presente a la izquierda: `{ La Liga Qanvit }` o solo `{ }` seguido del wordmark.
- **Divisores decorativos**: en landings, entre secciones: `— { } —`.
- **Loading states**: animación de llaves pulsando.
- **404 / estados vacíos**: `{ nada por aquí }`.

**Regla**: las llaves siempre están en `brand-salmon` cuando el fondo es oscuro, y en `brand-navy` cuando el fondo es claro. Nunca en lavender.

## 4. Tono y voz

### 4.1 Principios

1. **Confiado, no arrogante**. "Aquí está tu posición" no "Te posicionamos".
2. **Directo, no seco**. Una línea de ánimo cuando procede, pero sin cursilería.
3. **Deportivo, no chillón**. "Has subido de División" sí; "¡¡¡ARRIBA CAMPEÓN!!!" no.
4. **Español ibérico por defecto**. Evitar "ustedes" formal; usar "tú" y "vosotros" donde aplique.
5. **Técnico cuando toca**. Al dar feedback sobre el deck, lenguaje de VC/innovation scout real.

### 4.2 Copies clave (referencia)

| Contexto | Copy |
|---|---|
| Hero landing | **La liga de startups de España.** / Sube tu deck. Recibe feedback. Entra en la clasificación. |
| CTA principal | **Ficha tu startup** |
| CTA secundario (ecosistema) | Soy un parque / cluster / asociación |
| Estado "evaluando" | Estamos leyendo tu deck. Unos 40 segundos. |
| Resultado | Estás en **Seed Robotics** · **#4 nacional** en tu División · Vertical |
| Subida de División | Has **subido de División**. Bienvenido a Growth. |
| Leaderboard vacío | `{ la liga está empezando }` · Sé la primera en tu vertical. |
| Feedback sensible (score bajo) | Tu deck tiene cosas que pulir. Te las contamos abajo, con ejemplos de tu texto. |
| 404 | `{ esto no existe }` · [volver al leaderboard] |

### 4.3 Micro-copies prohibidos

- "Desbloquea tu potencial"
- "Únete a la revolución"
- "Como ningún otro"
- "El futuro del emprendimiento"
- Cualquier cosa con emoji corazón 💜 (sí otros emojis: 🥚🌱🚀👑🥇🥈🥉 para Divisiones y ranks)
- "Gestiona tus retos" / "Propón un reto" / "Votar reto" (→ redirigir a app.qanvit.com)
- "Contactar founder" / "Contacto directo" / "Lanza tu reto" (→ redirigir a app.qanvit.com)
- "Colabora con startups" (sin contexto) / "pipeline" en contexto ecosistema

## 4.x Separación La Liga vs Qanvit (comunicación externa)

- **Qanvit es el producto de valor comercial**: corporate venture con IA, BBDD de 16.000 startups, 4 agentes.
- **La Liga es free, público, gamificado** y actúa como funnel hacia Qanvit.
- **Nunca posicionar La Liga como producto autosuficiente** en landing / emails / bridges / copy comercial. Cuando se menciona Qanvit, asociarlo al verbo real ("convierte retos en pilotos", "descubre startups"), no adjetivos vacíos.
- Orgs del ecosystem son **leads cualificados de Qanvit**. Sus tiers de Liga se traducen en % de descuento al contratar Qanvit (10/20/30%, comunicativo, se aplica manualmente desde `hola@qanvit.com`).
- **No inventar features de Qanvit** en copy: solo usar las 4 capacidades de los agentes + la BBDD de 16.000.

## 5. Layout y espaciado

### 5.1 Grid

- Container max: `1280px` en desktop.
- Padding horizontal: `clamp(16px, 4vw, 48px)`.
- Gap vertical entre secciones: `clamp(64px, 8vw, 128px)`.

### 5.2 Cards

- Border radius: `16px` (medium) / `24px` (hero cards).
- Shadow: `0 1px 2px rgba(34, 24, 58, 0.04), 0 8px 24px rgba(34, 24, 58, 0.06)`.
- Background: `surface-card` (white) sobre `brand-lavender` body.
- Border: `1px solid border-soft`.

### 5.3 Buttons (shadcn extendido)

**Primary** (brand-navy fondo):
- bg `brand-navy` / text `white` / hover `navy-800`.
- Padding: `py-3 px-6`.
- Radius: `12px`.

**Secondary** (brand-salmon acento):
- bg `brand-salmon` / text `brand-navy` / hover `salmon-600`.

**Ghost**:
- text `brand-navy` / bg `transparent` / hover `lavender`.

## 6. Imagen "carta de clasificación" (shareable)

Al completar la evaluación, se genera una imagen OG (1200×630) que la startup puede compartir en redes:

```
┌──────────────────────────────────────────────────┐
│  { La Liga Qanvit }                              │
│                                                  │
│         [LOGO STARTUP 160x160]                   │
│                                                  │
│              NOMBRE STARTUP                      │
│                                                  │
│       Seed · Robotics                            │
│                                                  │
│           ┌────────┐                             │
│           │   87   │     Score                   │
│           └────────┘                             │
│                                                  │
│        #4 en Seed Robotics                       │
│           #27 en Seed League                     │
│                                                  │
│              laliga.qanvit.com                   │
└──────────────────────────────────────────────────┘
```

Fondo: gradiente diagonal de `brand-navy` a `#2d1f4a`. Detalles en `brand-salmon`. Logo startup sobre fondo blanco circular.

Generar con `@vercel/og` server-side.

## 7. Iconografía

- Sistema: **Lucide** (default shadcn).
- Para Divisiones: emojis + icono custom SVG en el brand pack del usuario.
- Para Verticales: iconos custom dibujados en línea fina (style outline, stroke 1.5px). Si el usuario no tiene, empezar con Lucide equivalentes.

## 8. Separación La Liga vs app.qanvit.com

La Liga Qanvit y app.qanvit.com son productos hermanos con roles distintos:

| La Liga Qanvit | app.qanvit.com |
|---|---|
| Observar el ecosistema de startups españolas | Gestionar innovación abierta y retos |
| Votar startups, ver rankings, recibir alertas | Lanzar retos, contactar startups, gestionar pipeline |
| Acceso por contribución (gamificación) | Producto de pago (planes SaaS) |

**Regla de copy**: cuando una funcionalidad o necesidad del usuario pertenece a app.qanvit.com, **NO omitirla ni ignorarla** — señalizarla activamente con un CTA:
> "Para [lanzar retos / contactar startups / gestionar innovación abierta] → app.qanvit.com"

El componente `CTAToAppQanvit` implementa estos CTA en 4 variantes (header, tile, inline, footer). Siempre con UTM params `?utm_source=laliga&utm_medium=cta&utm_campaign={variant}`.

## 9. Dark mode

V1 **no tiene dark mode**. El producto nace "dark feel" por default gracias al navy oscuro en muchas secciones (hero, header). Añadir dark mode explícito en V1.5 si hay demanda.

## 10. Accesibilidad

- Ratio de contraste mínimo AA (4.5:1 body, 3:1 grandes).
- Focus states visibles siempre (ring `brand-salmon`).
- `alt` en todas las imágenes.
- Atajos de teclado en el leaderboard (flechas para filtros).
- Respeto a `prefers-reduced-motion` en animaciones.

## 11. Tokens Tailwind (snippet listo)

Añadir a `tailwind.config.ts`:

```ts
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#22183a",
          salmon: "#f4a9aa",
          lavender: "#f1e8f4",
        },
        league: {
          ideation: "#b8c5d6",
          seed: "#a8d5ba",
          growth: "#f4a9aa",
          elite: "#c8a2c8",
        },
        rank: {
          gold: "#d4af37",
          silver: "#c0c0c0",
          bronze: "#cd7f32",
        },
        ink: {
          primary: "#1a1230",
          secondary: "#6b5b8a",
        },
      },
      fontFamily: {
        sora: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-open-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "16px",
        hero: "24px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(34, 24, 58, 0.04), 0 8px 24px rgba(34, 24, 58, 0.06)",
      },
    },
  },
};
```
