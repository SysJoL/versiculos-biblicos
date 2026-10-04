import type { APIRoute } from "astro";
import type { Lang, LocalVerseFile } from "@/lib/domain/types";
import { checkRateLimit, rateLimitHeaders } from "@/lib/server/rateLimiter";
import {
  normalizeText,
  scoreText,
} from "@/lib/domain/textSearch";
import versesEs from "@/data/verses-es.json";
import versesEn from "@/data/verses-en.json";

export const prerender = false;

const DEFAULT_BASE = "https://api.scripture.api.bible/v1";
const TIMEOUT_MS = 6000;
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX = 100;
const LIMIT = 8;

export type SearchHit = { ref: string; text: string };

type SearchPayload = {
  results: SearchHit[];
  source: "api-bible" | "local";
};

const memoryCache = new Map<string, { at: number; payload: SearchPayload }>();

function cacheGet(key: string): SearchPayload | null {
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

function cacheSet(key: string, payload: SearchPayload): void {
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

function sanitizeText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractHits(payload: unknown): SearchHit[] {
  const out: SearchHit[] = [];
  const seen = new Set<string>();
  const stack: unknown[] = [payload];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;
    if (Array.isArray(node)) {
      for (const item of node) stack.push(item);
      continue;
    }
    const rec = node as Record<string, unknown>;
    const ref =
      typeof rec.reference === "string" ? rec.reference.trim() : "";
    const raw =
      typeof rec.text === "string"
        ? rec.text
        : typeof rec.content === "string"
          ? rec.content
          : "";
    const text = sanitizeText(raw);
    if (ref && text) {
      const key = `${ref}::${text}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ ref, text });
      }
    }
    for (const value of Object.values(rec)) stack.push(value);
  }
  return out;
}

async function searchRemote(
  lang: Lang,
  query: string
): Promise<SearchHit[] | null> {
  const key = import.meta.env.API_BIBLE_KEY as string | undefined;
  const bid =
    lang === "es"
      ? (import.meta.env.PUBLIC_API_BIBLE_BID_ES as string | undefined)
      : (import.meta.env.PUBLIC_API_BIBLE_BID_EN as string | undefined);
  if (!key || !bid) return null;
  const base = (
    (import.meta.env.PUBLIC_API_BIBLE_BASE as string | undefined) ??
    DEFAULT_BASE
  ).replace(/\/$/, "");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const u = `${base}/bibles/${encodeURIComponent(bid)}/search?query=${encodeURIComponent(query)}&limit=10&sort=relevance`;
    const res = await fetch(u, {
      headers: { "api-key": key, accept: "application/json" },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as unknown;
    return extractHits(payload).slice(0, LIMIT);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function searchLocal(lang: Lang, query: string): SearchHit[] {
  const data = (lang === "es" ? versesEs : versesEn) as LocalVerseFile;
  return data.verses
    .map((v) => ({
      hit: { ref: v.ref, text: v.text },
      score: Math.max(
        scoreText(query, v.text, lang),
        scoreText(query, v.ref, lang) - 20
      ),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, LIMIT)
    .map((x) => x.hit);
}

export const GET: APIRoute = async ({ url, clientAddress }) => {
  const ip = clientAddress ?? "unknown";
  const rl = checkRateLimit(ip);
  const rlHdrs = rateLimitHeaders(ip);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ results: [], reason: "rate-limited" }),
      {
        status: 429,
        headers: jsonHeaders({ ...rlHdrs, "cache-control": "no-store" }),
      }
    );
  }

  const lang: Lang = url.searchParams.get("lang") === "en" ? "en" : "es";
  const q = (url.searchParams.get("q") ?? "").slice(0, 120).trim();
  if (q.length < 3) {
    return new Response(
      JSON.stringify({ results: [], reason: "too-short" }),
      { status: 200, headers: jsonHeaders(rlHdrs) }
    );
  }

  const cacheKey = `search:${lang}:${normalizeText(q)}`;
  const cached = cacheGet(cacheKey);
  if (cached) {
    return new Response(JSON.stringify(cached), {
      status: 200,
      headers: jsonHeaders({
        ...rlHdrs,
        "cache-control": "public, max-age=300, s-maxage=3600",
      }),
    });
  }

  const remote = await searchRemote(lang, q);
  if (remote && remote.length > 0) {
    const payload: SearchPayload = { results: remote, source: "api-bible" };
    cacheSet(cacheKey, payload);
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: jsonHeaders({
        ...rlHdrs,
        "cache-control": "public, max-age=300, s-maxage=3600",
      }),
    });
  }

  const payload: SearchPayload = {
    results: searchLocal(lang, q),
    source: "local",
  };
  cacheSet(cacheKey, payload);
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: jsonHeaders({
      ...rlHdrs,
      "cache-control": "public, max-age=300, s-maxage=3600",
    }),
  });
};
