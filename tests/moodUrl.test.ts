import assert from "node:assert/strict";
import { test } from "node:test";
import { withMoodParam } from "../src/lib/ui/moodUrl.ts";

test("replaces the active mood in the URL", () => {
  assert.equal(
    withMoodParam("/?lang=es&mood=all", "es", "hope"),
    "/?lang=es&mood=hope",
  );
});

test("sets lang and mood while preserving other params", () => {
  assert.equal(
    withMoodParam("/?foo=bar", "en", "love"),
    "/?foo=bar&lang=en&mood=love",
  );
});

test("accepts an absolute URL and keeps its path", () => {
  assert.equal(
    withMoodParam("https://refugio.local/?lang=es", "es", "comfort"),
    "/?lang=es&mood=comfort",
  );
});
