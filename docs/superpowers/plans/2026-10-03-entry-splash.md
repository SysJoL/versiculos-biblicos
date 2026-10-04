# Entry Splash Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar un splash de entrada con palomita + "Refugio celestial" en cada carga de `/`, con salida en cortina + onda en ~2.4 s.

**Architecture:** Nuevo componente Astro `EntrySplash.astro` (CSS + JS inline, 0 dependencias) renderizado solo en `index.astro`; se retira el bloque `AppHeader` del home para evitar duplicado.

**Tech Stack:** Astro 4, Tailwind 3, CSS keyframes + `script is:inline` (CSP actual permite `unsafe-inline`), sin nuevas dependencias.

**Spec:** `docs/superpowers/specs/2026-10-03-entry-splash-design.md`

## Global Constraints

- Solo en `/` (`src/pages/index.astro`); `/lectura` y `/favoritos` sin cambios.
- Duración total ~2.4 s: 1600 ms visible + 800 ms salida.
- Reutilizar `/img/paloma-top.png`; no crear nuevos assets.
- No tocar `BaseLayout.astro`; no añadir dependencias.
- `aria-hidden="true"` en el overlay; respetar `prefers-reduced-motion` (fade 0.3 s, sin scroll-lock).
- No usar `localStorage`: el splash aparece en cada document load de `/`.

## Review Focus

- Imagen `/img/paloma-top.png` rota o lenta → el splash igual se oculta a los 2.4 s y el texto sostiene la marca (Task 1, paso de `onerror` + timeout de respaldo).
- Usuario con `prefers-reduced-motion` → salida fade 0.3 s sin cortina ni bloqueo de scroll (Task 1, media query + rama JS).
- Usuario pulsa Esc o hace click durante el splash → salto inmediato, scroll restaurado, sin error (Task 1, listener + test manual).
- Primera pintura con throttling 3G → fondo sólido `#060612` desde el primer paint, sin flash blanco (Task 1, fondo en el propio nodo, test manual).
- Navegación a `/lectura` o `/favoritos` → ningún nodo `[data-entry-splash]` en el HTML (Task 2, grep de verificación).

---

### Task 1: Crear `EntrySplash.astro`

**Files:**
- Create: `src/components/celestial/EntrySplash.astro`
- Test: verificación con `node -e` (lectura de archivo) + `npm run build`

**Interfaces:**
- Consumes: nada (asset estático `/img/paloma-top.png`).
- Produces: componente `<EntrySplash />` sin props (idioma fijo ES en home, con rama EN si se pasa `lang`, por defecto `"es"`); emite `CustomEvent("refugio-splash-done")` al retirarse; expone `div[data-entry-splash]`.

- [ ] **Step 1: Escribir el check que falla (contenido del componente)**

```js
const fs = require("fs");
const s = fs.readFileSync("src/components/celestial/EntrySplash.astro", "utf8");
const assert = require("assert");
assert(s.includes("data-entry-splash"), "falta data-entry-splash");
assert(s.includes("/img/paloma-top.png"), "falta paloma-top.png");
assert(s.includes("REFUGIO CELESTIAL"), "falta título ES");
assert(s.includes("is-leaving"), "falta estado is-leaving");
assert(s.includes("prefers-reduced-motion"), "falta reduced-motion");
assert(s.includes("refugio-splash-done"), "falta evento done");
```

- [ ] **Step 2: Correr el check y ver que falla**

Run: `node -e "<check del Step 1>"`
Expected: FAIL con `ENOENT: no such file or directory` (el archivo no existe).

- [ ] **Step 3: Implementar `src/components/celestial/EntrySplash.astro` (sin props, `lang="es"` por defecto)**

Estructura exacta: `div[data-entry-splash]` fixed inset-0 z-[100] con `aria-hidden="true"` y `role="presentation"`; fondo `#060612` + velo radial dorado; dos `div.splash-panel.top/bottom`; SVG de onda inline entre paneles (`preserveAspectRatio="none"`, trazo dorado `rgba(212,175,55,0.35)`); centro con `img[src="/img/paloma-top.png"]` (`h-28 w-28`, `fetchpriority="high"`, `decoding="async"`, `onerror` que oculta el img), título `REFUGIO CELESTIAL` (`font-display tracking-[0.35em] text-gold-300`) + subtítulo `Versículos Bíblicos`; barra loader de 120 px con animación de 1.6 s. CSS en `<style>` del propio archivo: keyframes `splashDoveIn`, `splashBar`, transición de paneles `cubic-bezier(.7,0,.2,1) .8s`, estado `.is-leaving`, y rama `@media (prefers-reduced-motion: reduce)` con fade 0.3 s. JS en `<script is:inline>`: en `DOMContentLoaded` fija `body.style.overflow="hidden"` (salvo reduced-motion), programa `t+1600` añadir `.is-leaving` y `t+2400` hacer `remove()` + restaurar overflow + `dispatchEvent(new CustomEvent("refugio-splash-done"))`; Esc/click adelantan la salida; `onerror` del img no altera el timeline.

- [ ] **Step 4: Correr el check y ver que pasa**

Run: `node -e "<check del Step 1>"`
Expected: PASS sin asserts rotos.

- [ ] **Step 5: Commit**

```bash
git add src/components/celestial/EntrySplash.astro
git commit -m "feat: add entry splash overlay with curtain wave exit"
```

### Task 2: Integrar splash en `index.astro` y retirar `AppHeader`

**Files:**
- Modify: `src/pages/index.astro`
- Test: `node -e` checks + `npm run build`

**Interfaces:**
- Consumes: `EntrySplash` de Task 1 (import por defecto, sin props).
- Produces: home `/` con splash renderizado y sin bloque `AppHeader` (el archivo `AppHeader.astro` se conserva en disco).

- [ ] **Step 1: Escribir el check que falla (integración)**

```js
const fs = require("fs");
const s = fs.readFileSync("src/pages/index.astro", "utf8");
const assert = require("assert");
assert(s.includes("EntrySplash"), "falta import/uso de EntrySplash");
assert(s.includes("<EntrySplash"), "falta render <EntrySplash");
assert(!s.includes("AppHeader"), "AppHeader sigue referenciado en index");
assert(s.includes("data-entry-splash") || s.includes("EntrySplash"), "splash no integrado");
```

- [ ] **Step 2: Correr el check y ver que falla**

Run: `node -e "<check del Step 1>"`
Expected: FAIL en `falta import/uso de EntrySplash` (index aún no lo importa).

- [ ] **Step 3: Editar `src/pages/index.astro`**

Quitar `import AppHeader from "@/components/celestial/AppHeader.astro";`, añadir `import EntrySplash from "@/components/celestial/EntrySplash.astro";`, eliminar el `<div class="shrink-0 border-b ..."><AppHeader /></div>`, y renderizar `<EntrySplash />` como primer nodo tras `<SiteHeader ... />` (o justo antes de `</main>`, pero siempre dentro de `BaseLayout` y solo en este archivo). No tocar `SiteHeader`, `CosmicBackground`, `VerseCard`, `CategorySidebar`, footer ni prompts.

- [ ] **Step 4: Correr checks + build para ver que pasa**

Run: `node -e "<check del Step 1>"`
Expected: PASS.

Run: `npm run build`
Expected: exit 0, `Complete!` sin errores.

Run: `node -e "const fs=require('fs');const a=fs.readFileSync('src/pages/lectura.astro','utf8');const b=fs.readFileSync('src/pages/favoritos.astro','utf8');if(a.includes('EntrySplash')||b.includes('EntrySplash')){throw new Error('splash filtrado a otras paginas')};console.log('scope ok: splash solo en index')"`.
Expected: `scope ok: splash solo en index`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: show entry splash on home and remove AppHeader block"
```
