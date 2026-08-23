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

type VerseSegment = { n: number; text: string; heading?: string };

type PassageData = {
  label: string;
  intro: string;
  verses: VerseSegment[];
  translation?: string;
};

function readInitial(): {
  lang: Lang;
  bookCode?: string;
  chapter?: number;
  verse?: number;
} {
  if (typeof window === "undefined") return { lang: "es" };
  const q = new URLSearchParams(window.location.search);
  const lang: Lang = q.get("lang") === "en" ? "en" : "es";
  const refText = q.get("ref");
  if (!refText) return { lang };
  const parsed = parseRef(refText);
  if (!parsed) return { lang };
  const found = findCatalogBook(parsed.bookCode);
  if (!found) return { lang };
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
  const [lang] = useState<Lang>(init.lang);
  const [book, setBook] = useState<CatalogBook | null>(
    () => (init.bookCode ? findCatalogBook(init.bookCode) ?? null : null)
  );
  const [chapter, setChapter] = useState<number | null>(init.chapter ?? null);
  const [highlight, setHighlight] = useState<number | undefined>(init.verse);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<PassageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorReason, setErrorReason] = useState<string | undefined>(undefined);
  const [nonce, setNonce] = useState(0);
  const [sanctuary, setSanctuary] = useState<SanctuaryTheme>("celestial");

  const L = UI[lang].reader;
  const isNature = sanctuary === "nature";
  const stage = !book ? "books" : !chapter ? "chapters" : "text";

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
    (l: Lang, b: CatalogBook | null, c: number | null, v?: number) => {
      if (typeof window === "undefined") return;
      const q = new URLSearchParams();
      q.set("lang", l);
      if (b && c) q.set("ref", `${b.es} ${c}${v ? `:${v}` : ""}`.toLowerCase());
      window.history.replaceState(null, "", `${window.location.pathname}?${q.toString()}`);
    },
    []
  );

  useEffect(() => {
    if (!book || !chapter) return;
    const ctrl = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(false);

    const params = new URLSearchParams({
      lang,
      book: book.usfm,
      chapter: String(chapter),
      v: "4",
    });

    fetch(`/api/passage?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((json: { passage: PassageData | null; reason?: string }) => {
        if (cancelled) return;
        if (!json?.passage?.verses?.length) {
          setData(null);
          setError(true);
          setErrorReason(json?.reason);
        } else {
          setData(json.passage);
          setError(false);
        }
      })
      .catch((err) => {
        if (!cancelled && err?.name !== "AbortError") {
          setData(null);
          setError(true);
          setErrorReason(undefined);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, book?.usfm, chapter, nonce]);

  useEffect(() => {
    syncUrl(lang, book, chapter, highlight);
  }, [lang, book, chapter, highlight, syncUrl]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [stage]);

  useEffect(() => {
    if (loading || !highlight || !data) return;
    document.getElementById(`v-${highlight}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
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
    setSearch("");
  };

  const selectBook = (b: CatalogBook) => {
    setBook(b);
    setChapter(null);
    setHighlight(undefined);
  };

  const selectChapter = (c: number) => {
    setHighlight(undefined);
    setData(null);
    setChapter(c);
  };

  const onVerseClick = (n: number) => {
    setHighlight((prev) => (prev === n ? undefined : n));
  };

  const goBack = () => {
    if (stage === "text") {
      setData(null);
      setHighlight(undefined);
      setChapter(null);
    } else if (stage === "chapters") {
      setBook(null);
    }
  };

  const goChapter = (delta: number) => {
    if (!book || !chapter) return;
    const next = chapter + delta;
    if (next < 1 || next > book.chapters) return;
    setData(null);
    setHighlight(undefined);
    setChapter(next);
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
  const accentHover =
    isNature
      ? "hover:border-emerald-400/50 hover:bg-emerald-400/5"
      : "hover:border-gold-500/50 hover:bg-white/5";
  const chipBase =
    "focus-ring rounded-xl border bg-black/35 px-3 py-2 text-sm backdrop-blur-sm transition";

  const bookGroups = [
    { label: L.ot, list: OLD_TESTAMENT },
    { label: L.nt, list: NEW_TESTAMENT },
  ];

  return (
    <section className="w-full max-w-3xl">
      <div className="mb-4">
        <h1 className={`font-display text-xl font-bold sm:text-2xl ${accentText}`}>
          {L.title}
        </h1>
        <p className="mt-0.5 text-xs text-gold-100/60 sm:text-sm">{L.subtitle}</p>
      </div>

      <form onSubmit={onSearch} className="mb-4 flex gap-2">
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

      {stage !== "books" && (
        <nav className="mb-3 flex items-center gap-2 text-xs" aria-label="breadcrumb">
          <button
            type="button"
            onClick={goBack}
            className={`focus-ring inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/35 px-2.5 py-1.5 font-medium text-gold-200/80 transition hover:bg-white/5 hover:text-gold-100`}
          >
            <i className="fa-solid fa-chevron-left text-[10px]" aria-hidden />
            {stage === "text" ? L.backToChapters : L.backToBooks}
          </button>
          <span className="min-w-0 truncate text-gold-100/50">
            {stage === "chapters" && book
              ? bookLabel(book, lang)
              : book
                ? `${bookLabel(book, lang)} · ${L.chapter.toLowerCase()} ${chapter}`
                : ""}
          </span>
        </nav>
      )}

      {stage === "books" && (
        <div className="space-y-6">
          <p className={`text-sm font-semibold ${accentText}`}>{L.chooseBook}</p>
          {bookGroups.map((group) => (
            <div key={group.label}>
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-200/50">
                {group.label}
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {group.list.map((b) => (
                  <button
                    key={b.usfm}
                    type="button"
                    onClick={() => selectBook(b)}
                    className={`${chipBase} flex items-center justify-between gap-1 border-white/10 text-left text-gold-50/90 ${accentHover}`}
                  >
                    <span className="min-w-0 truncate">{bookLabel(b, lang)}</span>
                    <span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-gold-200/50">
                      {b.chapters}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {stage === "chapters" && book && (
        <div>
          <p className={`mb-2 text-sm font-semibold ${accentText}`}>
            {L.chooseChapter}
          </p>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
            {Array.from({ length: book.chapters }, (_, i) => i + 1).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => selectChapter(c)}
                aria-label={`${L.chapter} ${c}`}
                className={`focus-ring h-11 rounded-xl border bg-black/35 text-sm font-semibold text-gold-50/90 backdrop-blur-sm transition ${accentBorder} ${accentHover}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === "text" && book && chapter && (
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
                disabled={!chapter || chapter <= 1 || loading}
                aria-label={L.prevChapter}
                title={L.prevChapter}
                className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-gold-200 transition hover:bg-white/5 disabled:opacity-40"
              >
                <i className="fa-solid fa-chevron-left text-xs" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => goChapter(1)}
                disabled={!book || chapter >= book.chapters || loading}
                aria-label={L.nextChapter}
                title={L.nextChapter}
                className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-gold-200 transition hover:bg-white/5 disabled:opacity-40"
              >
                <i className="fa-solid fa-chevron-right text-xs" aria-hidden />
              </button>
              <button
                type="button"
                onClick={copyLink}
                title={L.copyLink}
                aria-label={L.copyLink}
                className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-gold-200 transition hover:bg-white/5"
              >
                <i className="fa-solid fa-link text-xs" aria-hidden />
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
              <p className="mb-3 text-sm text-red-300/90">
                {errorReason === "missing-key"
                  ? lang === "es"
                    ? "El servidor no tiene API_BIBLE_KEY configurada."
                    : "Server is missing API_BIBLE_KEY."
                  : errorReason === "missing-bible-id"
                    ? lang === "es"
                      ? "Falta configurar PUBLIC_API_BIBLE_BID_ES con el ID de tu Biblia en español (panel de api.bible)."
                      : "PUBLIC_API_BIBLE_BID_EN is not configured with a Bible ID."
                    : L.error}
              </p>
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
                <p className={`mb-3 text-sm font-semibold ${accentText} opacity-80`}>
                  {data.intro}
                </p>
              )}
              <div className="space-y-1.5 leading-relaxed">
                {data.verses.map((v) => (
                  <div key={v.n}>
                    {v.heading && (
                      <p
                        className={`mt-4 mb-1 px-2 text-[11px] font-bold uppercase tracking-wider ${accentText}`}
                      >
                        {v.heading}
                      </p>
                    )}
                    <p
                      id={`v-${v.n}`}
                      onClick={() => onVerseClick(v.n)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onVerseClick(v.n);
                        }
                      }}
                      aria-pressed={highlight === v.n}
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
                  </div>
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
      )}

      {stage === "text" && (
        <p className="mt-3 text-center text-xs text-gold-200/50">{L.verseHint}</p>
      )}
    </section>
  );
}
