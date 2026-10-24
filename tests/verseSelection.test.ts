import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildHintRefs,
  normalizeRef,
  pickRandom,
} from "../src/lib/domain/verseSelection.ts";

const local = Array.from({ length: 10 }, (_, i) => `Salmo ${i + 1}:1`);
const catalog = Array.from({ length: 15 }, (_, i) => `Proverbios ${i + 1}:1`);

function sequence(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length]!;
}

test("normalizeRef ignores accents, case and extra spaces", () => {
  assert.equal(normalizeRef("  Isaías   41:10 "), normalizeRef("ISAIAS 41:10"));
});

test("buildHintRefs combines local and catalog refs", () => {
  const refs = buildHintRefs({
    localRefs: local,
    catalogRefs: catalog,
    count: 8,
    rng: sequence([0.1, 0.7, 0.3, 0.9, 0.5]),
  });
  assert.equal(refs.length, 8);
  assert.equal(new Set(refs.map(normalizeRef)).size, 8);
});

test("buildHintRefs skips recently shown refs", () => {
  const avoid = new Set([...local, ...catalog.slice(0, 14)]);
  const refs = buildHintRefs({
    localRefs: local,
    catalogRefs: catalog,
    avoidRefs: avoid,
    count: 5,
  });
  assert.deepEqual(refs, [catalog[14]]);
});

test("buildHintRefs falls back to the whole pool when all refs were shown", () => {
  const refs = buildHintRefs({
    localRefs: local,
    catalogRefs: catalog,
    avoidRefs: [...local, ...catalog],
    count: 8,
  });
  assert.equal(refs.length, 8);
  assert.equal(new Set(refs.map(normalizeRef)).size, 8);
});

test("buildHintRefs does not repeat refs present in both pools", () => {
  const refs = buildHintRefs({
    localRefs: ["Salmo 23:1", "Salmo 23:1"],
    catalogRefs: ["Salmo 23:1"],
    count: 5,
  });
  assert.deepEqual(refs, ["Salmo 23:1"]);
});

test("pickRandom returns null on empty and an item otherwise", () => {
  assert.equal(pickRandom([]), null);
  assert.equal(pickRandom(["a", "b"], () => 0.99), "b");
});
