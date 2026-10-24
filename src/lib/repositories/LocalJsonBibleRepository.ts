import type { IBibleRepository } from "./IBibleRepository";
import {
  type Lang,
  type LocalVerseFile,
  type Mood,
  type Verse,
  MOOD_TO_EN,
  MOOD_TO_ES,
} from "../domain/types";
import { formatVerseId } from "../domain/types";

type LocalVerse = LocalVerseFile["verses"][number];

/**
 * Local JSON fallbacks: Spanish RVR dataset + English curated.
 *
 * Category picks use a shuffle bag per language/mood so every verse in the
 * pool is shown once before any of them repeats. This matters for small pools
 * such as the Spanish "perdón" category (10 refs), where a plain random pick
 * with a 20-ref avoid window used to start repeating immediately.
 */
export class LocalJsonBibleRepository implements IBibleRepository {
  private readonly bags = new Map<string, string[]>();
  private readonly lastRef = new Map<string, string>();

  constructor(
    private readonly byLang: { es: LocalVerseFile; en: LocalVerseFile }
  ) {}

  private getPool(lang: Lang, mood: Mood): LocalVerse[] {
    const data = this.byLang[lang];
    let pool = data.verses;

    if (mood !== "all") {
      const key = lang === "es" ? MOOD_TO_ES[mood] : MOOD_TO_EN[mood];
      const filtered = pool.filter((p) => p.categories.includes(key));
      if (filtered.length > 0) pool = filtered;
    }

    return pool;
  }

  /** All refs available for a language/mood, in dataset order. */
  getRefsForMood(lang: Lang, mood: Mood): string[] {
    return this.getPool(lang, mood).map((v) => v.ref);
  }

  private takeFromBag(
    lang: Lang,
    mood: Mood,
    pool: LocalVerse[],
    avoidRefs: ReadonlySet<string>
  ): string | null {
    if (pool.length === 0) return null;

    const key = `${lang}:${mood}`;
    let bag = this.bags.get(key);
    if (!bag || bag.length === 0) {
      bag = pool.map((v) => v.ref);
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      // Never repeat the same verse twice in a row when the bag refills.
      const previous = this.lastRef.get(key);
      const first = bag[0];
      if (previous && first === previous && bag.length > 1) {
        const swap = 1 + Math.floor(Math.random() * (bag.length - 1));
        [bag[0], bag[swap]] = [bag[swap]!, bag[0]!];
      }
      this.bags.set(key, bag);
    }

    // Prefer refs that were not shown recently. If the bag only holds avoided
    // refs we still return one (the pool is exhausted, so any repeat is fair).
    let index = bag.findIndex((ref) => !avoidRefs.has(ref));
    if (index < 0) index = 0;
    const [ref] = bag.splice(index, 1);
    if (ref) this.lastRef.set(key, ref);
    return ref ?? null;
  }

  getRandomFromLocal(
    lang: Lang,
    mood: Mood,
    avoidRefs: ReadonlySet<string>
  ): Verse | null {
    const pool = this.getPool(lang, mood);
    if (pool.length === 0) return null;

    const ref = this.takeFromBag(lang, mood, pool, avoidRefs);
    const pick =
      (ref ? pool.find((v) => v.ref === ref) : null) ??
      pool[Math.floor(Math.random() * pool.length)] ??
      null;
    if (!pick) return null;

    return {
      id: formatVerseId(
        pick.ref,
        lang,
        "local"
      ),
      text: pick.text,
      ref: pick.ref,
      source: "local",
      categories: [...pick.categories],
      language: lang,
    };
  }
}
