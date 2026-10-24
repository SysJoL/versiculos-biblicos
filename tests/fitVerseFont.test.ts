import assert from "node:assert/strict";
import { test } from "node:test";
import {
  VERSE_FONT_MAX,
  VERSE_FONT_MIN,
  VERSE_TEXT_MAX_HEIGHT,
  fitVerseFontSize,
} from "../src/lib/ui/fitVerseFont.ts";

/**
 * Simula el alto real que tendría el párrafo: al reducir la fuente, el texto
 * ocupa menos líneas y cada línea es más baja, así que el alto cae con el
 * cuadrado del tamaño. Es la misma relación que se midió en la web con
 * Ester 8:9 (846 px de alto a 42 px).
 */
function simulateHeight(heightAt42: number) {
  return (size: number) => Math.round(heightAt42 * (size / 42) ** 2);
}

test("un versículo corto conserva la fuente máxima", () => {
  const measure = (size: number) => Math.round(180 * (size / 58));
  assert.equal(fitVerseFontSize(measure), VERSE_FONT_MAX);
});

test("un versículo largo baja la fuente hasta el mayor tamaño que cabe", () => {
  const measure = simulateHeight(846); // Ester 8:9 medido en producción
  const size = fitVerseFontSize(measure);

  assert.ok(size < 42, `esperaba una fuente menor que 42px, recibí ${size}px`);
  assert.ok(
    measure(size) <= VERSE_TEXT_MAX_HEIGHT,
    `el texto a ${size}px mide ${measure(size)}px y no cabe en ${VERSE_TEXT_MAX_HEIGHT}px`
  );
  assert.ok(
    measure(size + 1) > VERSE_TEXT_MAX_HEIGHT,
    `había espacio para ${size + 1}px y se eligió ${size}px`
  );
});

test("elige el mayor tamaño que cabe, no el primero que encuentra", () => {
  const measure = (size: number) => (size <= 30 ? 500 : 600);
  assert.equal(fitVerseFontSize(measure, { maxHeight: 550 }), 30);
});

test("nunca reduce la fuente por debajo del mínimo legible", () => {
  const measure = () => 5000;
  assert.equal(fitVerseFontSize(measure), VERSE_FONT_MIN);
});

test("usa búsqueda binaria (pocas mediciones de layout)", () => {
  let calls = 0;
  const measure = (size: number) => {
    calls += 1;
    return simulateHeight(846)(size);
  };
  fitVerseFontSize(measure);
  assert.ok(calls <= 8, `midió ${calls} veces; se esperaba una búsqueda binaria`);
});

test("la zona segura deja sitio al logo, la referencia y el pie", () => {
  assert.ok(VERSE_TEXT_MAX_HEIGHT > 0);
  assert.ok(VERSE_TEXT_MAX_HEIGHT < 1080 - 2 * 58);
  assert.ok(VERSE_FONT_MIN < VERSE_FONT_MAX);
});
