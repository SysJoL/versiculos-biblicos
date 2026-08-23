import type {
  IRemoteBibleSource,
  VerseFetchHints,
} from "./IBibleRepository";
import type { Lang, Mood, Verse } from "../domain/types";
import { formatVerseId } from "../domain/types";

const DEFAULT_BASE = "https://bible-api.com";

type BibleApiRandomResponse = {
  random_verse: {
    book_id: string;
    book: string;
    chapter: number;
    verse: number;
    text: string;
  };
};

type BibleApiPassageResponse = {
  reference?: string;
  text?: string;
  error?: string;
};

function sanitize(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Remote verses from bible-api.com (World English Bible by default). Only English.
 */
export class BibleApiRepository implements IRemoteBibleSource {
  constructor(
    private readonly baseUrl: string = import.meta.env.PUBLIC_BIBLE_API_BASE ??
      DEFAULT_BASE
  ) {}

  supportsLanguage(lang: Lang): boolean {
    return lang === "en";
  }

  async fetchVerse(
    lang: Lang,
    mood: Mood,
    avoidRefs: ReadonlySet<string>,
    hints?: VerseFetchHints
  ): Promise<Verse | null> {
    if (lang !== "en") return null;

    const refs = (hints?.refs ?? []).filter(
      (r) => !avoidRefs.has(r.toLowerCase())
    );
    for (const ref of refs) {
      const verse = await this.fetchByReference(ref);
      if (verse && !avoidRefs.has(verse.ref.toLowerCase())) return verse;
    }

    if (mood !== "all") return null;

    const res = await fetch(
      `${this.baseUrl}/data/web/random`.replace(/\/$/, "")
    );
    if (!res.ok) return null;
    const data = (await res.json()) as BibleApiRandomResponse;
    const rv = data?.random_verse;
    if (!rv?.text) return null;
    const ref = `${rv.book} ${rv.chapter}:${rv.verse}`.replace(/\n/g, " ");
    const v: Verse = {
      id: formatVerseId(ref, "en", "bible-api"),
      text: rv.text.trim().replace(/\n/g, " "),
      ref,
      source: "bible-api",
      categories: [],
      language: "en",
    };
    return v;
  }

  private async fetchByReference(ref: string): Promise<Verse | null> {
    try {
      const ctrl =
        typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = ctrl
        ? setTimeout(() => ctrl.abort(), 6000)
        : null;
      let res: Response;
      try {
        res = await fetch(
          `${this.baseUrl}/${encodeURIComponent(ref)}`.replace(/\/$/, ""),
          ctrl ? { signal: ctrl.signal } : undefined
        );
      } finally {
        if (timer) clearTimeout(timer);
      }
      if (!res.ok) return null;
      const data = (await res.json()) as BibleApiPassageResponse;
      const text = data?.text ? sanitize(data.text) : "";
      if (!text || data.error) return null;
      const finalRef = sanitize(data.reference ?? ref);
      return {
        id: formatVerseId(finalRef, "en", "bible-api"),
        text,
        ref: finalRef,
        source: "bible-api",
        categories: [],
        language: "en",
      };
    } catch {
      return null;
    }
  }
}
