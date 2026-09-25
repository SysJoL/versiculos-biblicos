import type {
  IRemoteBibleSource,
} from "../repositories/IBibleRepository";
import type { LocalJsonBibleRepository } from "../repositories/LocalJsonBibleRepository";
import { VerseRefCache } from "../cache/VerseRefCache";
import { sampleCatalogRefs } from "../domain/verseCatalog";
import type { Lang, Mood, Verse } from "../domain/types";

type Source =
  | { kind: "remote"; idx: number }
  | { kind: "local" };

function shuffleSources(
  remotes: IRemoteBibleSource[],
  lang: Lang
): Source[] {
  const sources: Source[] = [];
  for (let i = 0; i < remotes.length; i++) {
    if (remotes[i].supportsLanguage(lang)) {
      sources.push({ kind: "remote", idx: i });
    }
  }
  sources.push({ kind: "local" });
  for (let i = sources.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sources[i], sources[j]] = [sources[j], sources[i]];
  }
  return sources;
}

export class VerseService {
  constructor(
    private readonly local: LocalJsonBibleRepository,
    private readonly remotes: IRemoteBibleSource[],
    private readonly cache: VerseRefCache
  ) {}

  private rememberAndReturn(verse: Verse): Verse {
    this.cache.rememberRef(verse.ref);
    return verse;
  }

  async getNextVerse(lang: Lang, mood: Mood): Promise<Verse> {
    const avoid = this.cache.asSet();

    if (mood === "all") {
      const sources = shuffleSources(this.remotes, lang);
      for (const src of sources) {
        if (src.kind === "remote") {
          const fromRemote = await this.remotes[src.idx].fetchVerse(
            lang,
            mood,
            avoid
          );
          if (fromRemote && !avoid.has(fromRemote.ref)) {
            return this.rememberAndReturn(fromRemote);
          }
        } else {
          const fromLocal = this.local.getRandomFromLocal(lang, mood, avoid);
          if (fromLocal) {
            return this.rememberAndReturn(fromLocal);
          }
        }
      }
      const anyLocal = this.local.getRandomFromLocal(lang, mood, new Set());
      if (anyLocal) return this.rememberAndReturn(anyLocal);
      return this.fallbackVerse();
    }

    const capableRemotes = this.remotes.filter((r) => r.supportsLanguage(lang));
    const orderedRemotes =
      lang === "en" ? [...capableRemotes].reverse() : capableRemotes;

    for (let round = 0; round < 3; round++) {
      const hints = { refs: sampleCatalogRefs(lang, mood, 6) };

      for (const remote of orderedRemotes) {
        try {
          const fromRemote = await remote.fetchVerse(
            lang,
            mood,
            avoid,
            hints
          );
          if (fromRemote && !avoid.has(fromRemote.ref)) {
            return this.rememberAndReturn(fromRemote);
          }
        } catch {
          // try the next source on network/API errors
        }
      }

      const fromLocal = this.local.getRandomFromLocal(lang, mood, avoid);
      if (fromLocal) {
        return this.rememberAndReturn(fromLocal);
      }
    }

    const last = this.local.getRandomFromLocal(lang, mood, new Set());
    if (last) {
      return this.rememberAndReturn(last);
    }

    return this.fallbackVerse();
  }

  private fallbackVerse(): Verse {
    return {
      id: "fallback",
      text: "In the beginning God created the heaven and the earth.",
      ref: "Genesis 1:1",
      source: "local",
      categories: [],
      language: "en",
    };
  }
}
