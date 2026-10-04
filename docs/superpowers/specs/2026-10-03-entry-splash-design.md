# Entry Splash — Refugio Celestial (palomita + texto)

Fecha: 2026-10-03
Estado: propuesta aprobada en chat, pendiente revisión del archivo
Alcance: solo `src/pages/index.astro` (`/`)

## 1. Objetivo

Sacar la palomita + frase "Refugio celestial" del contenido del home y convertirla en
vista preview de entrada:

- Al cargar `/` aparece overlay a pantalla completa con palomita y texto.
- Tras ~2.4 s se oculta con efecto cortina doble + filo ondulado.
- Ocurre en cada carga de `/` (document load completo, no SPA).
- `AppHeader` actual (subtítulo + paloma + divisor) se retira de `index.astro`
  porque quedaría duplicado y vacío. `lectura` y `favoritos` no se tocan.

## 2. Decisiones acordadas

- Duración: 1.6 s visible + 0.8 s salida = ~2.4 s total.
- Alcance: solo inicio `/`.
- Efecto salida: cortina doble + onda SVG (recomendado y aprobado).
- Enfoque: opción A — componente Astro `EntrySplash.astro` con CSS + mini-JS inline,
  0 dependencias. Descartados B (React/canvas, +80 KB, peor TTI) y C (solo CSS,
  sin control de scroll-lock / Esc / reduced-motion).

## 3. Arquitectura

- Nuevo `src/components/celestial/EntrySplash.astro`.
- Renderizado solo en `index.astro`, antes del cierre de `BaseLayout`
  (no en `BaseLayout.astro` para no contaminar `/lectura` y `/favoritos`).
- `index.astro`: eliminar `import AppHeader` y su `<div>` contenedor
  (sin borrar el archivo `AppHeader.astro`); subir `StreakBadge` + grid
  sidebar/versículo. Mantener `SiteHeader`,
  `CosmicBackground`, `VerseCard`, footer y prompts.
- Sin cambios de routing, i18n o providers. Texto fijo:
  ES "REFUGIO CELESTIAL" / "Versículos Bíblicos",
  EN "CELESTIAL REFUGE" / "Bible Verses" (según `currentLang` si se pasa prop,
  por defecto ES en home).

## 4. Componente y visual

Estructura:

- `div[data-entry-splash]` → `fixed inset-0 z-[100]`, `aria-hidden="true"`.
- Fondo `#060612` + velo radial dorado `rgba(212,175,55,0.12)`.
- Dos paneles `.splash-panel.top/.bottom` para la cortina.
- Filo ondulado: SVG inline `preserveAspectRatio="none"` con path dorado
  `rgba(212,175,55,0.35)` entre paneles.
- Centro: `img /img/paloma-top.png` 112 px (`h-28 w-28`, `fetchpriority="high"`,
  `decoding="async"`), glow `drop-shadow(0 0 24px rgba(212,175,55,.45))`,
  animación entrada `splashDoveIn .9s ease both`.
- Título `font-display tracking-[0.35em]` + subtítulo `font-body`.
- Barra loader 120 px que se llena en 1.6 s (`splashBar 1.6s linear forwards`).
- Todo el CSS en `<style>` del propio `.astro`; sin tocar `global.css`
  salvo que se quiera reutilizar keyframes (no requerido).

## 5. Comportamiento / data flow

1. `DOMContentLoaded` → `body[data-splash-lock]` con `overflow:hidden`.
2. `t + 1600 ms` → añadir `.is-leaving` (paneles suben con
   `cubic-bezier(.7,0,.2,1) .8s`, paloma hace `scale(.94)` + `fade`).
3. `t + 2400 ms` → `remove()` del nodo, restaurar `overflow`,
   `dispatchEvent(new CustomEvent("refugio-splash-done"))`.
4. Escape o click → salto inmediato (añade `.is-leaving` y acorta a 350 ms).
5. `prefers-reduced-motion: reduce` → sin cortina: `fade .3s`, sin scroll-lock.
6. Si la imagen falla o tarda (>800 ms sin `complete`), el timeline sigue igual;
   el texto garantiza la marca. `onerror` oculta el `img`, no bloquea la salida.
7. Una vez por pestaña (`sessionStorage["refugio-splash-shown"]`): la primera
   carga de `/` muestra el splash; navegaciones internas (filtros por
   categoría, que son GET completos) y recargas en la misma pestaña lo
   saltan retirando el nodo antes del primer paint. Pestaña nueva =
   splash de nuevo. Revisión 2026-10-03: el "cada document load" original
   re-mostaba el splash al filtrar y se cambió por este gate.

## 6. Accesibilidad

- `aria-hidden="true"`, `role="presentation"`, sin foco atrapado.
- No interfiere con lectores: se elimina del DOM al terminar.
- Contraste título dorado `#e4cf87` sobre `#060612` (>7:1).
- Respeta `prefers-reduced-motion`.

## 7. Rendimiento / SEO

- Overlay no desplaza layout (fixed), no afecta CLS.
- LCP del home puede retrasarse ~1.6 s visualmente; aceptado por el usuario.
  Mitigación: `fetchpriority="high"` + preload implícito al estar en HTML inicial,
  sin JS pesado (solo inline <2 KB).
- CSP actual permite `script 'unsafe-inline'`, por lo que el `<script is:inline>`
  pasa sin cambios.

## 8. Archivos tocados

1. Nuevo `src/components/celestial/EntrySplash.astro`.
2. Editar `src/pages/index.astro`: importar y renderizar splash, quitar `AppHeader`.
3. Ningún otro archivo.

## 9. Pruebas

- `npm run build` exit 0.
- Manual 390 px y 1280 px: splash cubre viewport, no hay scroll durante 2.4 s,
  luego scroll normal; paloma + texto centrados; cortina + onda visibles.
- DevTools 3G: sin flash blanco (fondo sólido desde primer paint).
- Teclado: Esc salta el splash.
- `Emulate CSS media feature prefers-reduced-motion`: salida fade 0.3 s.
- Lighthouse home: comprobar que LCP no regresa >300 ms vs base (nota: el splash
  es intencional, documentar si sube).
- Navegación a `/lectura` y `/favoritos`: sin splash.

## 10. Fuera de alcance

- Splash en lectura/favoritos.
- "Solo primera vez" con localStorage.
- Sonido, partículas canvas o video.
- Cambio de logo o nuevos assets (se reutiliza `/img/paloma-top.png`).
