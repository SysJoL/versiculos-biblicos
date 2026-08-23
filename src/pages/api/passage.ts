import type { APIRoute } from "astro";
import { checkRateLimit, rateLimitHeaders } from "@/lib/server/rateLimiter";
import {
  findBookByName,
  normalizeBookName,
  parseRef,
} from "@/lib/domain/refParser";
import {
  BOOKS,
  findCatalogBook,
  type CatalogBook,
} from "@/lib/data/booksCatalog";

export const prerender = false;

const DEFAULT_BASE = "https://api.scripture.api.bible/v1";
const BIBLE_API_BASE = (
  import.meta.env.PUBLIC_BIBLE_API_BASE ?? "https://bible-api.com"
).replace(/\/$/, "");
const TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 80;

type VerseSegment = { n: number; text: string };

type PassagePayload = {
  passage: {
    label: string;
    intro: string;
    verses: VerseSegment[];
    translation?: string;
  } | null;
  source: string;
};

type CacheEntry = { at: number; payload: PassagePayload };

const memoryCache = new Map<string, CacheEntry>();

function cacheGet(key: string): PassagePayload | null {
  const hit = memoryCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  memoryCache.delete(key);
  memoryCache.set(key, hit);
  return hit.payload;
}

function cacheSet(key: string, payload: PassagePayload): void {
  if (memoryCache.size >= CACHE_MAX) {
    const oldest = memoryCache.keys().next().value;
    if (oldest) memoryCache.delete(oldest);
  }
  memoryCache.set(key, { at: Date.now(), payload });
}

const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'";
const jsonHeaders = (
  extra: Record<string, string> = {}
): Record<string, string> => ({
  "content-type": "application/json",
  "content-security-policy": CSP,
  ...extra,
});

function stripTags(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function htmlToVerses(html: string): { intro: string; verses: VerseSegment[] } {
  const supRe = /<sup[^>]*>/i;
  const closeRe = /<\/sup>/i;
  const firstIdx = html.search(supRe);

  if (firstIdx < 0) {
    const text = stripTags(html);
    return { intro: "", verses: text ? [{ n: 1, text }] : [] };
  }

  const intro = stripTags(html.slice(0, firstIdx));
  const body = html.slice(firstIdx);
  const chunks = body.split(/<sup[^>]*>/i).slice(1);
  const verses: VerseSegment[] = [];

  for (const chunk of chunks) {
    const closeMatch = closeRe.exec(chunk);
    if (!closeMatch) continue;
    const rawNum = chunk.slice(0, closeMatch.index).trim();
    const n = parseInt(rawNum.replace(/\D/g, ""), 10);
    const rest = chunk.slice(closeMatch.index + closeMatch[0].length);
    const text = stripTags(rest);
    if (!Number.isFinite(n) || !text) continue;
    verses.push({ n, text });
  }

  return { intro, verses };
}

async function fetchWithTimeout(
  url: string,
  init?: RequestInit
): Promise<Response | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFromApiBible(
  lang: "es" | "en",
  fqi: string
): Promise<PassagePayload | null> {
  const key = import.meta.env.API_BIBLE_KEY;
  const bid =
    lang === "es"
      ? import.meta.env.PUBLIC_API_BIBLE_BID_ES
      : import.meta.env.PUBLIC_API_BIBLE_BID_EN;
  if (!key || !bid) return null;

  const base = (
    import.meta.env.PUBLIC_API_BIBLE_BASE ?? DEFAULT_BASE
  ).replace(/\/$/, "");
  const url = `${base}/bibles/${encodeURIComponent(bid)}/passages/${encodeURIComponent(fqi)}?content-type=html`;
  const res = await fetchWithTimeout(url, {
    headers: { "api-key": key, accept: "application/json" },
  });
  if (!res || !res.ok) return null;

  const data = (await res.json()) as {
    data?: { id?: string; content?: string } | Array<{ id?: string; content?: string }>;
  };
  const item = Array.isArray(data?.data)
    ? data.data.find((p) => typeof p?.content === "string")
    : data?.data && typeof data.data.content === "string"
      ? data.data
      : null;
  if (!item?.content) return null;

  const { intro, verses } = htmlToVerses(item.content);
  if (verses.length === 0) return null;
  const [main] = fqi.split("-");
  const label = main ?? fqi;
  return {
    passage: { label, intro, verses },
    source: "api-bible",
  };
}

function apiBibleStatus(
  lang: "es" | "en"
): { status: string; detail: string } {
  const key = Boolean(import.meta.env.API_BIBLE_KEY);
  const bid =
    lang === "es"
      ? Boolean(import.meta.env.PUBLIC_API_BIBLE_BID_ES)
      : Boolean(import.meta.env.PUBLIC_API_BIBLE_BID_EN);
  if (!key && !bid) return { status: "missing-key", detail: "API_BIBLE_KEY y BID ausentes" };
  if (!key) return { status: "missing-key", detail: "API_BIBLE_KEY ausente" };
  if (!bid) return { status: "missing-bible-id", detail: `PUBLIC_API_BIBLE_BID_${lang.toUpperCase()} ausente` };
  return { status: "ok", detail: "" };
}

async function listApiBibles(
  language: "spa" | "eng"
): Promise<Array<{ id: string; name: string; abbreviation?: string }> | null> {
  const key = import.meta.env.API_BIBLE_KEY;
  if (!key) return null;
  const base = (
    import.meta.env.PUBLIC_API_BIBLE_BASE ?? DEFAULT_BASE
  ).replace(/\/$/, "");
  const url = `${base}/bibles?language=${language}&format=text`;
  const res = await fetchWithTimeout(url, {
    headers: { "api-key": key, accept: "application/json" },
  });
  if (!res || !res.ok) return null;
  const data = (await res.json()) as {
    data?: Array<{ id: string; name: string; abbreviation?: string }>;
  };
  return data?.data ?? null;
}

async function fetchFromBibleApi(
  enName: string,
  chapter: number
): Promise<PassagePayload | null> {
  const url = `${BIBLE_API_BASE}/${encodeURIComponent(`${enName} ${chapter}`)}`;
  const res = await fetchWithTimeout(url);
  if (!res || !res.ok) return null;

  const data = (await res.json()) as {
    error?: string;
    reference?: string;
    translation_name?: string;
    verses?: Array<{ verse?: number; text?: string }>;
    text?: string;
  };
  if (data.error) return null;

  const verses: VerseSegment[] = (data.verses ?? [])
    .map((v) => ({ n: Number(v.verse), text: stripTags(v.text ?? "") }))
    .filter((v) => Number.isFinite(v.n) && v.text.length > 0);

  if (verses.length > 0) {
    return {
      passage: {
        label: `${normalizeBookLabel(enName)} ${chapter}`,
        intro: "",
        verses,
        translation: data.translation_name,
      },
      source: "bible-api",
    };
  }

  const single = data.text ? stripTags(data.text) : "";
  if (!single) return null;
  return {
    passage: {
      label: data.reference ?? `${normalizeBookLabel(enName)} ${chapter}`,
      intro: "",
      verses: [{ n: 1, text: single }],
      translation: data.translation_name,
    },
    source: "bible-api",
  };
}

function normalizeBookLabel(enName: string): string {
  return enName.replace(/\s+/g, " ").trim();
}

function resolveBook(raw: string | null): CatalogBook | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^[0-9]?[A-Za-z]{2}$/.test(trimmed)) {
    const byUsfm = findCatalogBook(trimmed);
    if (byUsfm) return byUsfm;
  }
  const code = findBookByName(trimmed);
  if (!code) return null;
  return BOOKS.find((b) => b.usfm === code) ?? null;
}

export const GET: APIRoute = async ({ url, clientAddress }) => {
  const ip = clientAddress ?? "unknown";
  const rl = checkRateLimit(ip);
  const rlHdrs = rateLimitHeaders(ip);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ passage: null, reason: "rate-limited" }), {
      status: 429,
      headers: jsonHeaders({ ...rlHdrs, "cache-control": "no-store" }),
    });
  }

  if (url.searchParams.get("debug") === "bibles") {
    const spa = await listApiBibles("spa");
    const eng = await listApiBibles("eng");
    return new Response(
      JSON.stringify({
        keyPresent: Boolean(import.meta.env.API_BIBLE_KEY),
        bidEs: Boolean(import.meta.env.PUBLIC_API_BIBLE_BID_ES),
        bidEn: Boolean(import.meta.env.PUBLIC_API_BIBLE_BID_EN),
        base: import.meta.env.PUBLIC_API_BIBLE_BASE ?? DEFAULT_BASE,
        spanish: spa?.slice(0, 20) ?? null,
        english: eng?.slice(0, 20) ?? null,
      }),
      { status: 200, headers: jsonHeaders({ "cache-control": "no-store" }) }
    );
  }

  const lang = url.searchParams.get("lang") === "en" ? "en" : "es";
  const chapterParam = Number(url.searchParams.get("chapter"));
  const verseParam = Number(url.searchParams.get("verse"));
  const endParam = Number(url.searchParams.get("end"));

  const refText = url.searchParams.get("ref");
  let book = resolveBook(url.searchParams.get("book"));
  let chapter = Number.isFinite(chapterParam) && chapterParam > 0 ? Math.floor(chapterParam) : 0;
  let verse = Number.isFinite(verseParam) && verseParam > 0 ? Math.floor(verseParam) : undefined;
  let verseEnd = Number.isFinite(endParam) && endParam > 0 ? Math.floor(endParam) : undefined;

  if ((!book || !chapter) && refText) {
    const parsed = parseRef(refText);
    if (parsed) {
      book = resolveBook(parsed.bookCode) ?? resolveBook(parsed.bookName);
      chapter = parsed.chapter;
      verse = parsed.verse;
      verseEnd = parsed.verseEnd;
    }
  }

  if (!book || !chapter || chapter > book.chapters) {
    return new Response(JSON.stringify({ passage: null, reason: "bad-request" }), {
      status: 400,
      headers: jsonHeaders({ ...rlHdrs, "cache-control": "no-store" }),
    });
  }
  if (verse !== undefined && verse > 500) verse = undefined;
  if (verseEnd !== undefined && (!verse || verseEnd < verse)) verseEnd = undefined;

  const cacheKey = `${lang}:${book.usfm}.${chapter}${verse ? `.${verse}${verseEnd ? `-${verseEnd}` : ""}` : ""}`;
  const cached = cacheGet(cacheKey);
  if (cached) {
    return new Response(JSON.stringify(cached), {
      status: 200,
      headers: jsonHeaders({
        "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      }),
    });
  }

  let payload: PassagePayload | null = null;

  if (lang === "en") {
    payload = await fetchFromBibleApi(book.en, chapter);
    if (!payload) payload = await fetchFromApiBible("en", `${book.usfm}.${chapter}`);
  } else {
    const fqi =
      verse !== undefined
        ? verseEnd
          ? `${book.usfm}.${chapter}.${verse}-${book.usfm}.${chapter}.${verseEnd}`
          : `${book.usfm}.${chapter}.${verse}`
        : `${book.usfm}.${chapter}`;
    payload = await fetchFromApiBible("es", fqi);
  }

  if (!payload || !payload.passage) {
    const diag = apiBibleStatus(lang);
    const reason =
      diag.status !== "ok" ? diag.status : "upstream-error";
    return new Response(
      JSON.stringify({ passage: null, reason, detail: diag.detail }),
      {
        status: reason === "upstream-error" ? 502 : 503,
        headers: jsonHeaders({ ...rlHdrs, "cache-control": "no-store" }),
      }
    );
  }

  const labelBook = lang === "es" ? book.es : book.en;
  payload.passage.label = verse
    ? `${labelBook} ${chapter}:${verse}${verseEnd ? `-${verseEnd}` : ""}`
    : `${labelBook} ${chapter}`;

  cacheSet(cacheKey, payload);

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: jsonHeaders({
      "cache-control":
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    }),
  });
};
