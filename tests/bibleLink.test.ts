import assert from "node:assert/strict";
import { test } from "node:test";
import { bibleReaderHref } from "../src/lib/ui/bibleLink.ts";

test("builds the Spanish reader link for a reference", () => {
  assert.equal(
    bibleReaderHref("Salmo 25:5", "es"),
    "/lectura?lang=es&ref=Salmo%2025%3A5",
  );
});

test("builds the English reader link for a reference", () => {
  assert.equal(
    bibleReaderHref("Psalm 25:5", "en"),
    "/lectura?lang=en&ref=Psalm%2025%3A5",
  );
});

test("encodes accents and trims surrounding spaces", () => {
  assert.equal(
    bibleReaderHref("  Isaías 41:10 ", "es"),
    "/lectura?lang=es&ref=Isa%C3%ADas%2041%3A10",
  );
});
