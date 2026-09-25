import type { Lang, Mood, Verse } from "../domain/types";

/**
 * Data access boundary for Bible verse content (Repository in Clean Architecture).
 */
export interface IBibleRepository {
  getRandomFromLocal(
    lang: Lang,
    mood: Mood,
    avoidRefs: ReadonlySet<string>
  ): Verse | null;
}

export interface VerseFetchHints {
  refs?: string[];
}

export interface IRemoteBibleSource {
  readonly supportsLanguage: (lang: Lang) => boolean;
  fetchVerse(
    lang: Lang,
    mood: Mood,
    avoidRefs: ReadonlySet<string>,
    hints?: VerseFetchHints
  ): Promise<Verse | null>;
}
