import assert from "node:assert/strict";
import { test } from "node:test";
import {
  compareHref,
  compareHrefForLang,
  readReaderRef,
} from "../src/lib/reader/refState.ts";

test("lee libro, capítulo y versículo de una referencia en español", () => {
  const ref = readReaderRef("Juan 3:16");
  assert.equal(ref.book?.usfm, "JHN");
  assert.equal(ref.testament, "NT");
  assert.equal(ref.chapter, 3);
  assert.equal(ref.verse, 16);
});

test("lee una referencia en inglés y sin versículo", () => {
  const ref = readReaderRef("John 3");
  assert.equal(ref.book?.usfm, "JHN");
  assert.equal(ref.chapter, 3);
  assert.equal(ref.verse, undefined);
});

test("limita el capítulo al total del libro", () => {
  const ref = readReaderRef("Juan 99");
  assert.equal(ref.book?.usfm, "JHN");
  assert.equal(ref.chapter, 21);
});

test("una referencia inválida devuelve el estado vacío", () => {
  const ref = readReaderRef("no es un libro 3:16");
  assert.equal(ref.book, null);
  assert.equal(ref.testament, null);
  assert.equal(ref.chapter, null);
  assert.equal(ref.verse, undefined);
});

test("construye la URL de comparar con la referencia en minúsculas", () => {
  const ref = readReaderRef("Juan 3:16");
  assert.equal(
    compareHref(ref),
    "/comparar?ref=juan+3%3A16",
  );
});

test("construye la URL de comparar sin versículo", () => {
  const ref = readReaderRef("Salmos 23");
  assert.equal(compareHref(ref), "/comparar?ref=salmos+23");
});

test("sin pasaje devuelve la ruta limpia", () => {
  assert.equal(compareHref(readReaderRef(null)), "/comparar");
});

test("conserva el idioma de la interfaz en la URL de comparar", () => {
  const ref = readReaderRef("Juan 3:16");
  assert.equal(
    compareHrefForLang(ref, "en"),
    "/comparar?ref=juan+3%3A16&lang=en",
  );
});

test("añade el idioma incluso sin pasaje", () => {
  assert.equal(compareHrefForLang(readReaderRef(null), "es"), "/comparar?lang=es");
});
