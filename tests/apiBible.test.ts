import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchPassage } from "../src/lib/server/apiBible.ts";

function stubFetch(
  handler: (url: string) => Response | Promise<Response>
): { calls: string[]; restore: () => void } {
  const calls: string[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    return handler(url);
  }) as typeof fetch;
  return { calls, restore: () => (globalThis.fetch = original) };
}

test("requests a single passage id and asks for plain text", async () => {
  const stub = stubFetch(
    () =>
      new Response(
        JSON.stringify({
          data: { id: "PSA.23.1", content: "El Señor es mi pastor" },
        }),
        { status: 200 }
      )
  );
  try {
    const passage = await fetchPassage(
      "https://api.test/v1",
      "bible-1",
      "secret",
      "PSA.23.1",
      1000
    );
    assert.equal(passage?.content, "El Señor es mi pastor");
    assert.equal(stub.calls.length, 1);
    const url = stub.calls[0]!;
    assert.match(url, /\/bibles\/bible-1\/passages\/PSA\.23\.1\?/);
    assert.match(url, /include-verse-numbers=false/);
    assert.match(url, /content-type=text/);
  } finally {
    stub.restore();
  }
});

test("never joins several passage ids in one request", async () => {
  const stub = stubFetch(
    () => new Response(JSON.stringify({ data: null }), { status: 404 })
  );
  try {
    const results = await Promise.all([
      fetchPassage("https://api.test/v1", "b", "k", "PSA.23.1", 1000),
      fetchPassage("https://api.test/v1", "b", "k", "JHN.3.16", 1000),
    ]);
    assert.deepEqual(results, [null, null]);
    assert.equal(stub.calls.length, 2);
    for (const url of stub.calls) {
      assert.doesNotMatch(url.split("?")[0]!, /,/);
    }
  } finally {
    stub.restore();
  }
});

test("returns null on HTTP errors, bad payloads and aborts", async () => {
  const errorStub = stubFetch(() => new Response("nope", { status: 500 }));
  try {
    assert.equal(
      await fetchPassage("https://api.test/v1", "b", "k", "PSA.23.1", 1000),
      null
    );
  } finally {
    errorStub.restore();
  }

  const badStub = stubFetch(
    () => new Response(JSON.stringify({ data: {} }), { status: 200 })
  );
  try {
    assert.equal(
      await fetchPassage("https://api.test/v1", "b", "k", "PSA.23.1", 1000),
      null
    );
  } finally {
    badStub.restore();
  }

  const abortStub = stubFetch(
    () => Promise.reject(new DOMException("aborted", "AbortError"))
  );
  try {
    assert.equal(
      await fetchPassage("https://api.test/v1", "b", "k", "PSA.23.1", 1000),
      null
    );
  } finally {
    abortStub.restore();
  }
});
