import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanVerseText } from "../src/lib/domain/verseText.ts";

test("removes inline markup without splitting words", () => {
  assert.equal(
    cleanVerseText("el nombre del S<span>eñor</span> delante de ti"),
    "el nombre del Señor delante de ti"
  );
});

test("fixes words split around formatting and detached punctuation", () => {
  const raw =
    "Porque Él dice a Moisés: T<i>endré</i> misericordia del que yo tenga " +
    "misericordia<span>,</span> y tendré compasión<span>.</span>";
  assert.equal(
    cleanVerseText(raw),
    "Porque Él dice a Moisés: Tendré misericordia del que yo tenga " +
      "misericordia, y tendré compasión."
  );
});

test("joins lone capital consonants separated by a stray space", () => {
  assert.equal(
    cleanVerseText("proclamaré el nombre del S eñor delante de ti"),
    "proclamaré el nombre del Señor delante de ti"
  );
  assert.equal(
    cleanVerseText("Acuérdate, oh S eñor , de tu compasión"),
    "Acuérdate, oh Señor, de tu compasión"
  );
});

test("keeps valid one-letter words intact", () => {
  assert.equal(
    cleanVerseText("A él clamé y él me oyó, o tú o yo"),
    "A él clamé y él me oyó, o tú o yo"
  );
  assert.equal(
    cleanVerseText("I shall not want and I will rest"),
    "I shall not want and I will rest"
  );
});

test("strips verse number markers", () => {
  assert.equal(
    cleanVerseText("El amor de Dios [16] Porque de tal manera amó"),
    "El amor de Dios Porque de tal manera amó"
  );
});

test("normalizes unicode spaces and zero-width characters", () => {
  assert.equal(
    cleanVerseText("Dios\u00A0creó\u200B los cielos"),
    "Dios creó los cielos"
  );
});

test("drops paragraph pilcrows from text mode", () => {
  assert.equal(
    cleanVerseText("\u00B6Y ahora, Señor, ¿qué espero?"),
    "Y ahora, Señor, ¿qué espero?"
  );
});

test("block tags leave a gap, inline tags do not", () => {
  assert.equal(
    cleanVerseText("<p>Dios es <i>amor</i>.</p><p>Él nos amó.</p>"),
    "Dios es amor. Él nos amó."
  );
});

test("preserveNewlines keeps br breaks and trims each line", () => {
  assert.equal(
    cleanVerseText("Línea uno<br>  línea dos<i>,</i>  ", {
      preserveNewlines: true,
    }),
    "Línea uno\nlínea dos,"
  );
  assert.equal(
    cleanVerseText("Línea uno<br>línea dos<i>,</i>"),
    "Línea uno línea dos,"
  );
});

test("collapses repeated whitespace and trims", () => {
  assert.equal(cleanVerseText("  Dios   es    amor  "), "Dios es amor");
});
