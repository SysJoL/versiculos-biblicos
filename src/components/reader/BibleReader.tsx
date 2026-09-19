import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UI } from "@/lib/i18n/labels";
import type { Lang } from "@/lib/domain/types";
import { parseRef } from "@/lib/domain/refParser";
import {
  NEW_TESTAMENT,
  OLD_TESTAMENT,
  bookLabel,
  findCatalogBook,
  getRefSuggestions,
  type CatalogBook,
  type RefSuggestion,
} from "@/lib/data/booksCatalog";
import {
  getStoredSanctuary,
  type SanctuaryTheme,
} from "@/lib/ui/sanctuary";
import { showToast } from "@/lib/ui/toast";
import { VerseContextMenu } from "./VerseContextMenu";
import { VerseMenuSheet } from "./VerseMenuSheet";
import { VerseSquareImage } from "./VerseSquareImage";

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
  const [testament, setTestament] = useState<"AT" | "NT" | null>(
    () => (init.bookCode ? findCatalogBook(init.bookCode)?.testament ?? null : null)
  );
  const [chapter, setChapter] = useState<number | null>(init.chapter ?? null);
  const [highlight, setHighlight] = useState<number | undefined>(init.verse);
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<PassageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorReason, setErrorReason] = useState<string | undefined>(undefined);
  const [nonce, setNonce] = useState(0);
  const [sanctuary, setSanctuary] = useState<SanctuaryTheme>("celestial");
  // El header del sitio se oculta al bajar (clase `nav-hidden`); las barras
  // sticky del lector suben al top para ocupar su lugar y bajan cuando regresa.
  const [siteNavHidden, setSiteNavHidden] = useState(false);

  useEffect(() => {
    const el = document.querySelector("[data-site-header]");
    if (!el) return;
    const sync = () => setSiteNavHidden(el.classList.contains("nav-hidden"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const L = UI[lang].reader;
  const isNature = sanctuary === "nature";
  // Offset de las barras sticky: debajo del header del sitio, o pegadas al
  // top cuando este se oculta al bajar.
  const stickyTop = siteNavHidden
    ? "top-[env(safe-area-inset-top,0px)]"
    : "top-[calc(4.5rem+env(safe-area-inset-top,0px))] md:top-[calc(5rem+env(safe-area-inset-top,0px))]";
  const stage = !book ? (testament ? "books" : "testaments") : !chapter ? "chapters" : "text";

  useEffect(() => {
    setSanctuary(getStoredSanctuary());
    const handler = (e: Event) => {
      const theme = (e as CustomEvent<{ theme: SanctuaryTheme }>).detail?.theme;
      if (theme === "celestial" || theme === "nature") setSanctuary(theme);
    };
    window.addEventListener("refugio-sanctuary-changed", handler);
    return () => window.removeEventListener("refugio-sanctuary-changed", handler);
  }, []);

  const suggestions = useMemo(
    () => getRefSuggestions(search, lang, 7),
    [search, lang]
  );
  const parsedPreview = useMemo(() => parseRef(search), [search]);
  const trimmedSearch = search.trim();
  // Modo texto: no es referencia válida ni hay sugerencia de libro, y hay
  // suficiente texto para buscar por palabras ("amor", "En el principio…").
  const textMode =
    parsedPreview === null &&
    suggestions.length === 0 &&
    trimmedSearch.length >= 3;
  const showSuggestions = focused && trimmedSearch.length > 0;

  type TextHit = { ref: string; text: string };
  const [textResults, setTextResults] = useState<TextHit[]>([]);
  const [textLoading, setTextLoading] = useState(false);

  useEffect(() => {
    setActiveIdx(-1);
  }, [search]);

  // Búsqueda por texto con debounce (300ms) y cancelación.
  useEffect(() => {
    if (!textMode) {
      setTextLoading(false);
      return;
    }
    setTextLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ lang, q: trimmedSearch });
      fetch(`/api/search?${params.toString()}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((json: { results?: TextHit[] }) => {
          setTextResults(
            Array.isArray(json?.results) ? json.results.slice(0, 8) : []
          );
        })
        .catch((err) => {
          if (err?.name !== "AbortError") setTextResults([]);
        })
        .finally(() => setTextLoading(false));
    }, 300);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [textMode, trimmedSearch, lang]);

  const totalOptions =
    suggestions.length + (textMode ? textResults.length : 0);

  useEffect(() => {
    if (!focused) return;
    const onPointerDown = (e: PointerEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [focused]);

  const applySuggestion = useCallback(
    (s: RefSuggestion) => {
      if (!s.chapter) {
        setBook(s.book);
        setTestament(s.book.testament);
        setChapter(null);
        setHighlight(undefined);
        setData(null);
      } else {
        if (s.chapter < 1 || s.chapter > s.book.chapters) {
          showToast(
            lang === "es" ? "Referencia fuera de rango." : "Reference out of range.",
            "warning"
          );
          return;
        }
        // Si cambia de libro/capítulo, limpia el texto anterior para evitar parpadeo.
        if (book?.usfm !== s.book.usfm || chapter !== s.chapter) {
          setData(null);
        }
        setBook(s.book);
        setTestament(s.book.testament);
        setChapter(s.chapter);
        setHighlight(s.verse);
      }
      setSearch("");
      setActiveIdx(-1);
      setFocused(false);
      inputRef.current?.blur();
    },
    [lang, book?.usfm, chapter]
  );

  /** Abre un resultado de búsqueda por texto (ej: "amor" → Salmo 136:1). */
  const applyHit = useCallback(
    (hit: { ref: string; text: string }) => {
      const parsed = parseRef(hit.ref);
      const found = parsed ? findCatalogBook(parsed.bookCode) : undefined;
      if (!parsed || !found) {
        showToast(L.noResultsText, "warning");
        return;
      }
      if (parsed.chapter < 1 || parsed.chapter > found.chapters) {
        showToast(
          lang === "es" ? "Referencia fuera de rango." : "Reference out of range.",
          "warning"
        );
        return;
      }
      setData(null);
      setBook(found);
      setTestament(found.testament);
      setChapter(parsed.chapter);
      setHighlight(parsed.verse);
      setSearch("");
      setTextResults([]);
      setActiveIdx(-1);
      setFocused(false);
      inputRef.current?.blur();
    },
    [lang, L.noResultsText]
  );

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
      v: "5",
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
    // Si hay opción activa (navegación por teclado), úsala: refs primero,
    // luego resultados de texto.
    if (activeIdx >= 0 && activeIdx < totalOptions) {
      if (activeIdx < suggestions.length) {
        const s = suggestions[activeIdx];
        if (s) applySuggestion(s);
        return;
      }
      const hit = textResults[activeIdx - suggestions.length];
      if (hit) applyHit(hit);
      return;
    }
    // Si hay una sola sugerencia exacta con capítulo, úsala directo.
    if (suggestions.length === 1 && suggestions[0]?.chapter) {
      const only = suggestions[0];
      const parsed = parseRef(search);
      if (!parsed) {
        applySuggestion(only);
        return;
      }
    }
    const parsed = parseRef(search);
    if (!parsed) {
      // No es referencia: abre el primer versículo relacionado si lo hay.
      // La búsqueda por texto ya va filtrada por el idioma del switch.
      if (textResults[0]) {
        applyHit(textResults[0]);
        return;
      }
      if (textLoading) return;
      showToast(L.noResultsText, "warning");
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
    setTestament(found.testament);
    setChapter(parsed.chapter);
    setHighlight(parsed.verse);
    setSearch("");
    setFocused(false);
  };

  const onSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" && totalOptions > 0) {
      e.preventDefault();
      setFocused(true);
      setActiveIdx((prev) => (prev + 1) % totalOptions);
    } else if (e.key === "ArrowUp" && totalOptions > 0) {
      e.preventDefault();
      setActiveIdx((prev) => (prev <= 0 ? totalOptions - 1 : prev - 1));
    } else if (e.key === "Escape") {
      setActiveIdx(-1);
      setFocused(false);
    }
  };

  const activeDescendant =
    activeIdx >= 0 && activeIdx < totalOptions
      ? activeIdx < suggestions.length
        ? `reader-search-opt-${activeIdx}`
        : `reader-search-text-${activeIdx - suggestions.length}`
      : undefined;

  const selectTestament = (t: "AT" | "NT") => {
    setBook(null);
    setChapter(null);
    setHighlight(undefined);
    setData(null);
    setTestament(t);
  };

  const selectBook = (b: CatalogBook) => {
    setBook(b);
    setTestament(b.testament);
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

  type MenuVerse = { n: number; text: string };
  const [menuVerse, setMenuVerse] = useState<MenuVerse | null>(null);
  // Con posición → popover (clic derecho en PC); sin posición → sheet (botón ⋮).
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const [squareVerse, setSquareVerse] = useState<{ n: number; text: string } | null>(null);

  const openVerseMenu = useCallback(
    (clientX: number, clientY: number, verse: { n: number; text: string }) => {
      setHighlight(verse.n);
      setSquareVerse(verse);
      setMenuVerse({ n: verse.n, text: verse.text });
      setPopoverPos({ x: clientX, y: clientY });
    },
    []
  );

  const openVerseSheet = useCallback((verse: { n: number; text: string }) => {
    setHighlight(verse.n);
    setSquareVerse(verse);
    setMenuVerse({ n: verse.n, text: verse.text });
    setPopoverPos(null);
  }, []);

  const closeVerseMenu = useCallback(() => {
    setMenuVerse(null);
    setPopoverPos(null);
  }, []);

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

  const testamentBooks = testament === "NT" ? NEW_TESTAMENT : OLD_TESTAMENT;
  const testamentLabel = testament === "NT" ? L.newTestament : L.oldTestament;
  const testamentCards = [
    {
      key: "AT" as const,
      label: L.oldTestament,
      count: OLD_TESTAMENT.length,
      icon: "fa-solid fa-scroll",
    },
    {
      key: "NT" as const,
      label: L.newTestament,
      count: NEW_TESTAMENT.length,
      icon: "fa-solid fa-cross",
    },
  ];

  const searchForm = (
      <form onSubmit={onSearch} className="mb-4 flex gap-2" role="search">
        <div ref={searchBoxRef} className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={onSearchKeyDown}
            placeholder={L.searchPlaceholder}
            aria-label={L.search}
            role="combobox"
            aria-expanded={showSuggestions}
            aria-controls="reader-search-listbox"
            aria-activedescendant={activeDescendant}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className={`${chipBase} w-full border-white/15 pr-9 text-gold-50 placeholder:text-gold-200/40 focus:outline-none`}
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setTextResults([]);
                setActiveIdx(-1);
                inputRef.current?.focus();
              }}
              aria-label={L.clearSearch}
              title={L.clearSearch}
              className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-xl text-gold-200/60 transition hover:text-gold-100"
            >
              <i className="fa-solid fa-xmark text-sm" aria-hidden />
            </button>
          )}
          {showSuggestions && (
            <div className="absolute inset-x-0 top-full z-30 pt-1.5">
              <ul
                id="reader-search-listbox"
                role="listbox"
                aria-label={L.suggestionsLabel}
                className="max-h-72 overflow-y-auto rounded-xl border border-white/15 bg-[#141021]/95 p-1.5 shadow-2xl backdrop-blur-md"
              >
                {suggestions.map((s, i) => (
                  <li key={s.key} role="option" aria-selected={i === activeIdx}>
                    <button
                      id={`reader-search-opt-${i}`}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applySuggestion(s)}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition active:scale-[0.99] ${
                        i === activeIdx
                          ? isNature
                            ? "bg-emerald-400/15 text-emerald-100"
                            : "bg-gold-500/15 text-gold-100"
                          : "text-gold-50/90 hover:bg-white/5"
                      }`}
                    >
                      <span className="min-w-0 truncate font-medium">
                        {s.label}
                      </span>
                      <span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-gold-200/60">
                        {s.sub}
                      </span>
                    </button>
                  </li>
                ))}
                {suggestions.length === 0 && !textMode && (
                  <li className="px-3 py-3 text-center text-xs text-gold-200/60">
                    {L.noResults}
                  </li>
                )}
                {textMode && (
                  <>
                    <li
                      aria-hidden
                      className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gold-200/50"
                    >
                      {L.relatedVerses}
                    </li>
                    {textLoading && textResults.length === 0 && (
                      <li className="space-y-2 px-3 py-2" aria-live="polite">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="h-9 animate-pulse rounded-lg bg-white/10"
                          />
                        ))}
                        <span className="sr-only">{L.searchingVerses}</span>
                      </li>
                    )}
                    {textResults.map((hit, j) => {
                      const i = suggestions.length + j;
                      return (
                        <li key={hit.ref} role="option" aria-selected={i === activeIdx}>
                          <button
                            id={`reader-search-text-${j}`}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applyHit(hit)}
                            onMouseEnter={() => setActiveIdx(i)}
                            className={`block w-full rounded-lg px-3 py-2.5 text-left transition active:scale-[0.99] ${
                              i === activeIdx
                                ? isNature
                                  ? "bg-emerald-400/15"
                                  : "bg-gold-500/15"
                                : "hover:bg-white/5"
                            }`}
                          >
                            <span
                              className={`block text-[11px] font-bold uppercase tracking-wider ${accentText}`}
                            >
                              {hit.ref}
                            </span>
                            <span className="mt-0.5 block line-clamp-2 text-sm text-gold-50/90">
                              {hit.text}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                    {!textLoading && textResults.length === 0 && (
                      <li className="px-3 py-3 text-center text-xs text-gold-200/60">
                        {L.noResultsText}
                      </li>
                    )}
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
        <button
          type="submit"
          className={`${chipBase} shrink-0 font-semibold ${accentBorder} ${accentText} hover:bg-white/5`}
        >
          {L.search}
        </button>
    </form>
  );

  const stickyBg = isNature ? "bg-[#081208]/88" : "bg-[#0b0f24]/88";

  return (
    <section className="w-full max-w-3xl">
      <div className="mb-4">
        <h1 className={`font-display text-xl font-bold sm:text-2xl ${accentText}`}>
          {L.title}
        </h1>
        <p className="mt-0.5 text-xs text-gold-100/60 sm:text-sm">{L.subtitle}</p>
      </div>

      {stage === "books" ? (
        <div
          className={`sticky ${stickyTop} z-20 mb-4 rounded-2xl border border-white/10 px-3 pt-3 shadow-[0_10px_28px_rgba(0,0,0,0.35)] backdrop-blur-md transition-[top] duration-200 sm:px-4 ${stickyBg}`}
        >
          {searchForm}
          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTestament(null)}
              aria-label={L.backToTestaments}
              title={L.backToTestaments}
              className="focus-ring inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-gold-200 transition hover:bg-white/5"
            >
              <i className="fa-solid fa-chevron-left text-xs" aria-hidden />
            </button>
            <p className={`min-w-0 flex-1 truncate text-sm font-semibold ${accentText}`}>
              {testamentLabel}
            </p>
            <span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-gold-200/60">
              {L.booksCount(testamentBooks.length)}
            </span>
          </div>
        </div>
      ) : (
        searchForm
      )}

      {(stage === "chapters" || stage === "text") && (
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

      {stage === "testaments" && (
        <div className="space-y-3">
          <p className={`text-sm font-semibold ${accentText}`}>{L.chooseTestament}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {testamentCards.map((tc) => (
              <button
                key={tc.key}
                type="button"
                onClick={() => selectTestament(tc.key)}
                className={`${chipBase} flex items-center gap-3 border-white/10 p-4 text-left ${accentHover}`}
              >
                <span
                  className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-inset ring-white/10 ${accentText}`}
                >
                  <i className={`${tc.icon} text-lg`} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-gold-50/95">
                    {tc.label}
                  </span>
                  <span className="block text-xs text-gold-200/60">
                    {L.booksCount(tc.count)}
                  </span>
                </span>
                <i className="fa-solid fa-chevron-right shrink-0 text-xs text-gold-200/50" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      )}

      {stage === "books" && (
        <div className="space-y-6">
          <p className={`text-sm font-semibold ${accentText}`}>{L.chooseBook}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {testamentBooks.map((b) => (
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
          <header
            className={`sticky ${stickyTop} z-20 -mx-4 mb-3 flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2 shadow-[0_10px_28px_rgba(0,0,0,0.35)] backdrop-blur-md transition-[top] duration-200 sm:-mx-6 sm:px-6 ${
              isNature ? "bg-[#081208]/88" : "bg-[#0b0f24]/88"
            }`}
          >
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
                  <div key={v.n} className="group relative">
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
                      onContextMenu={(e) => {
                        e.preventDefault();
                        openVerseMenu(e.clientX, e.clientY, v);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onVerseClick(v.n);
                        }
                      }}
                      aria-pressed={highlight === v.n}
                      className={`cursor-pointer rounded-lg px-2 py-1 pr-9 text-[15px] transition-colors sm:text-base md:pr-2 ${
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
                    <button
                      type="button"
                      onClick={() => openVerseSheet(v)}
                      aria-label={L.verseOptions}
                      title={L.verseOptions}
                      className="focus-ring absolute top-1/2 right-0 inline-flex h-9 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gold-200/70 transition hover:bg-white/5 hover:text-gold-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                    >
                      <i className="fa-solid fa-ellipsis-vertical text-sm" aria-hidden />
                    </button>
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

      {menuVerse && book && chapter && popoverPos && (
        <VerseContextMenu
          x={popoverPos.x}
          y={popoverPos.y}
          lang={lang}
          sanctuary={sanctuary}
          verseRefLabel={`${bookLabel(book, lang)} ${chapter}:${menuVerse.n}`}
          verseText={menuVerse.text}
          verseUrl={`${window.location.origin}${window.location.pathname}?lang=${lang}&ref=${encodeURIComponent(
            `${book.es} ${chapter}:${menuVerse.n}`.toLowerCase()
          )}`}
          onClose={closeVerseMenu}
        />
      )}
      {menuVerse && book && chapter && !popoverPos && (
        <VerseMenuSheet
          isOpen
          lang={lang}
          sanctuary={sanctuary}
          verseRefLabel={`${bookLabel(book, lang)} ${chapter}:${menuVerse.n}`}
          verseText={menuVerse.text}
          verseUrl={`${window.location.origin}${window.location.pathname}?lang=${lang}&ref=${encodeURIComponent(
            `${book.es} ${chapter}:${menuVerse.n}`.toLowerCase()
          )}`}
          onClose={closeVerseMenu}
        />
      )}
      {squareVerse && book && chapter && (
        <VerseSquareImage
          text={squareVerse.text}
          refLabel={`${bookLabel(book, lang)} ${chapter}:${squareVerse.n}`}
          seedKey={`${book.usfm}.${chapter}.${squareVerse.n}`}
          sanctuary={sanctuary}
          footerText={lang === "es" ? "Refugio Celestial" : "Celestial Refuge"}
        />
      )}
    </section>
  );
}
