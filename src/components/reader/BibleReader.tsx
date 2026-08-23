import { useCallback, useEffect, useState } from "react";
import { UI } from "@/lib/i18n/labels";
import type { Lang } from "@/lib/domain/types";
import { parseRef } from "@/lib/domain/refParser";
import {
  NEW_TESTAMENT,
  OLD_TESTAMENT,
  bookLabel,
  findCatalogBook,
  type CatalogBook,
} from "@/lib/data/booksCatalog";
import {
  getStoredSanctuary,
  type SanctuaryTheme,
} from "@/lib/ui/sanctuary";
import { showToast } from "@/lib/ui/toast";

type VerseSegment = { n: number; text: string };

type PassageData = {
  label: string;
  intro: string;
  verses: VerseSegment[];
  translation?: string;
};

const DEFAULT_BOOK = "JHN";
const DEFAULT_CHAPTER = 1;

function readInitial(): {
  lang: Lang;
  bookCode: string;
  chapter: number;
  verse?: number;
} {
  const fallback = {
    lang: "es" as Lang,
    bookCode: DEFAULT_BOOK,
    chapter: DEFAULT_CHAPTER,
  };
  if (typeof window === "undefined") return fallback;
  const q = new URLSearchParams(window.location.search);
  const lang: Lang = q.get("lang") === "en" ? "en" : "es";
  const refText = q.get("ref");
  if (!refText) return { ...fallback, lang };
  const parsed = parseRef(refText);
  if (!parsed) return { ...fallback, lang };
  const found = findCatalogBook(parsed.bookCode);
  if (!found) return { ...fallback, lang };
  const chapter = Math.min(Math.max(parsed.chapter, 1), found.chapters);
  return {
    lang,
    bookCode: found.usfm,
    chapter,
    verse: parsed.verse && parsed.verse >= 1 ? parsed.verse : undefined,
  };
}

export function BibleReader() {
  const [init] = useState(readInitial);
  const [lang, setLang] = useState<Lang>(init.lang);
  const [book, setBook] = useState<CatalogBook>(
    () =>
      findCatalogBook(init.bookCode) ??
      (findCatalogBook(DEFAULT_BOOK) as CatalogBook)
  );
  const [chapter, setChapter] = useState<number>(init.chapter);
  const [highlight, setHighlight] = useState<number | undefined>(init.verse);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<PassageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [sanctuary, setSanctuary] = useState<SanctuaryTheme>("celestial");

  const L = UI[lang].reader;
  const isNature = sanctuary === "nature";

  useEffect(() => {
    setSanctuary(getStoredSanctuary());
    const handler = (e: Event) => {
      const theme = (e as CustomEvent<{ theme: SanctuaryTheme }>).detail?.theme;
      if (theme === "celestial" || theme === "nature") setSanctuary(theme);
    };
    window.addEventListener("refugio-sanctuary-changed", handler);
    return () => window.removeEventListener("refugio-sanctuary-changed", handler);
  }, []);

  const syncUrl = useCallback(
    (l: Lang, b: CatalogBook, c: number, v?: number) => {
      if (typeof window === "undefined") return;
      const q = new URLSearchParams();
      q.set("lang", l);
      q.set("ref", `${b.es} ${c}${v ? `:${v}` : ""}`.toLowerCase());
      window.history.replaceState(null, "", `${window.location.pathname}?${q.toString()}`);
    },
    []
  );

  useEffect(() => {
    const ctrl = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(false);

    const params = new URLSearchParams({
      lang,
      book: book.usfm,
      chapter: String(chapter),
    });

    fetch(`/api/passage?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((json: { passage: PassageData | null }) => {
        if (cancelled) return;
        if (!json?.passage?.verses?.length) {
          setData(null);
          setError(true);
        } else {
          setData(json.passage);
        }
      })
      .catch((err) => {
        if (!cancelled && err?.name !== "AbortError") setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    syncUrl(lang, book, chapter, highlight);
    return () => {
      cancelled = true;
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, book.usfm, chapter, nonce]);

  useEffect(() => {
    if (loading || !highlight || !data) return;
    const el = document.getElementById(`v-${highlight}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [loading, highlight, data]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseRef(search);
    if (!parsed) {
      showToast(
        lang === "es"
          ? "No se reconoció la referencia. Ej: Juan 3:16"
          : "Reference not recognized. E.g.: John 3:16",
        "warning"
      );
      return;
    }
    const found = findCatalogBook(parsed.bookCode);
    if (!found || parsed.chapter < 1 || parsed.chapter > found.chapters) {
      showToast(
        lang === "es" ? "Referencia fuera de rango." : "Reference out of range.",
        "warning"
      );
      return;
    }
    setBook(found);
    setChapter(parsed.chapter);
    setHighlight(parsed.verse);
  };

  const onVerseClick = (n: number) => {
    setHighlight(n);
    syncUrl(lang, book, chapter, n);
  };

  const goChapter = (delta: number) => {
    const next = chapter + delta;
    if (next < 1 || next > book.chapters) return;
    setHighlight(undefined);
    setChapter(next);
  };

  const changeLang = (l: Lang) => {
    if (l === lang) return;
    setLang(l);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast(L.copied, "success", 1600);
    } catch {
      showToast(
        lang === "es" ? "No se pudo copiar." : "Could not copy.",
        "error"
      );
    }
  };

  const accentBorder = isNature ? "border-emerald-400/30" : "border-gold-500/30";
  const accentText = isNature ? "text-emerald-300" : "text-gold-300";
  const chipBase =
    "focus-ring rounded-xl border bg-black/35 px-3 py-2 text-sm backdrop-blur-sm transition";

  return (
    <section className="w-full max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className={`font-display text-xl font-bold sm:text-2xl ${accentText}`}>
            {L.title}
          </h1>
          <p className="mt-0.5 text-xs text-gold-100/60 sm:text-sm">{L.subtitle}</p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1">
          {(["es", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => changeLang(l)}
              aria-pressed={lang === l}
              className={`focus-ring rounded-full px-3 py-1 text-xs font-semibold uppercase transition ${
                lang === l
                  ? isNature
                    ? "bg-emerald-400/20 text-emerald-200"
                    : "bg-gold-500/20 text-gold-200"
                  : "text-gold-200/60 hover:text-gold-100"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={onSearch} className="mb-3 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={L.searchPlaceholder}
          aria-label={L.search}
          className={`${chipBase} min-w-0 flex-1 border-white/15 text-gold-50 placeholder:text-gold-200/40 focus:outline-none`}
        />
        <button
          type="submit"
          className={`${chipBase} font-semibold ${accentBorder} ${accentText} hover:bg-white/5`}
        >
          {L.search}
        </button>
      </form>

      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <select
          value={book.usfm}
          onChange={(e) => {
            setHighlight(undefined);
            setChapter(1);
            setBook((prev) => findCatalogBook(e.target.value) ?? prev);
          }}
          aria-label={L.book}
          className={`${chipBase} border-white/15 text-gold-50 focus:outline-none`}
        >
          <optgroup label={L.ot}>
            {OLD_TESTAMENT.map((b) => (
              <option key={b.usfm} value={b.usfm}>
                {bookLabel(b, lang)} ({b.chapters})
              </option>
            ))}
          </optgroup>
          <optgroup label={L.nt}>
            {NEW_TESTAMENT.map((b) => (
              <option key={b.usfm} value={b.usfm}>
                {bookLabel(b, lang)} ({b.chapters})
              </option>
            ))}
          </optgroup>
        </select>
        <select
          value={chapter}
          onChange={(e) => {
            setHighlight(undefined);
            setChapter(Number(e.target.value));
          }}
          aria-label={L.chapter}
          className={`${chipBase} border-white/15 text-gold-50 focus:outline-none`}
        >
          {Array.from({ length: book.chapters }, (_, i) => i + 1).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={copyLink}
          title={L.copyLink}
          aria-label={L.copyLink}
          className={`${chipBase} ${accentBorder} ${accentText} col-span-2 hover:bg-white/5 sm:col-span-1`}
        >
          <i className="fa-solid fa-link" aria-hidden />
        </button>
      </div>

      <article
        className={`rounded-2xl border ${accentBorder} bg-black/40 p-4 shadow-lg backdrop-blur-md sm:p-6`}
      >
        <header className="mb-3 flex items-center justify-between gap-2 border-b border-white/10 pb-2">
          <h2 className={`font-display text-lg font-semibold ${accentText}`}>
            {data?.label ?? `${bookLabel(book, lang)} ${chapter}`}
          </h2>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => goChapter(-1)}
              disabled={chapter <= 1 || loading}
              aria-label={L.prevChapter}
              title={L.prevChapter}
              className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-gold-200 transition hover:bg-white/5 disabled:opacity-40"
            >
              <i className="fa-solid fa-chevron-left text-xs" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => goChapter(1)}
              disabled={chapter >= book.chapters || loading}
              aria-label={L.nextChapter}
              title={L.nextChapter}
              className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-gold-200 transition hover:bg-white/5 disabled:opacity-40"
            >
              <i className="fa-solid fa-chevron-right text-xs" aria-hidden />
            </button>
          </div>
        </header>

        {loading && (
          <div className="space-y-3 py-4" role="status" aria-live="polite">
            {[70, 95, 88, 92, 60].map((w, i) => (
              <div
                key={i}
                className="h-4 animate-pulse rounded bg-white/10"
                style={{ width: `${w}%` }}
              />
            ))}
            <span className="sr-only">{L.loading}</span>
          </div>
        )}

        {!loading && error && (
          <div className="py-8 text-center">
            <p className="mb-3 text-sm text-red-300/90">{L.error}</p>
            <button
              type="button"
              onClick={() => setNonce((n) => n + 1)}
              className={`${chipBase} ${accentBorder} ${accentText} font-semibold hover:bg-white/5`}
            >
              {L.retry}
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {data.intro && (
              <p className="mb-3 text-sm italic text-gold-100/60">{data.intro}</p>
            )}
            <div className="space-y-1.5 leading-relaxed">
              {data.verses.map((v) => (
                <p
                  key={v.n}
                  id={`v-${v.n}`}
                  onClick={() => onVerseClick(v.n)}
                  className={`cursor-pointer rounded-lg px-2 py-1 text-[15px] transition-colors sm:text-base ${
                    highlight === v.n
                      ? isNature
                        ? "bg-emerald-400/15 text-emerald-100 ring-1 ring-inset ring-emerald-400/40"
                        : "bg-gold-500/15 text-gold-100 ring-1 ring-inset ring-gold-500/45"
                      : "text-gold-50/90 hover:bg-white/5"
                  }`}
                >
                  <sup className={`mr-1 select-none text-xs font-bold ${accentText}`}>
                    {v.n}
                  </sup>
                  {v.text}
                </p>
              ))}
            </div>
            {data.translation && (
              <footer className="mt-4 border-t border-white/10 pt-2 text-right text-xs text-gold-200/50">
                {data.translation}
              </footer>
            )}
          </>
        )}
      </article>

      <p className="mt-3 text-center text-xs text-gold-200/50">{L.verseHint}</p>
    </section>
  );
}
