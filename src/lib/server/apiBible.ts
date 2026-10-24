/**
 * Thin wrapper around api.bible's passage endpoint.
 *
 * The endpoint accepts ONE passage id per request. Sending a comma-separated
 * list (the previous behaviour) answers 404, so every category request fell
 * back to keyword search and the curated verses were never used.
 */

export type ApiBiblePassage = {
  id: string;
  content: string;
};

export async function fetchPassage(
  base: string,
  bibleId: string,
  key: string,
  id: string,
  timeoutMs: number,
  fetchImpl: typeof fetch = fetch
): Promise<ApiBiblePassage | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const params = new URLSearchParams({
      "content-type": "text",
      "include-notes": "false",
      "include-titles": "false",
      "include-chapter-numbers": "false",
      "include-verse-numbers": "false",
    });
    const url = `${base}/bibles/${encodeURIComponent(
      bibleId
    )}/passages/${encodeURIComponent(id)}?${params}`;
    const res = await fetchImpl(url, {
      headers: { "api-key": key, accept: "application/json" },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as {
      data?: { id?: unknown; content?: unknown };
    };
    const data = payload?.data;
    if (!data || typeof data.content !== "string") return null;
    return {
      id: typeof data.id === "string" ? data.id : id,
      content: data.content,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
