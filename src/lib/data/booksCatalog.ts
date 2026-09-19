import { findBookByName, normalizeBookName, splitRefQuery } from "../domain/refParser";

export interface CatalogBook {
  usfm: string;
  es: string;
  en: string;
  chapters: number;
  testament: "AT" | "NT";
}

export const BOOKS: CatalogBook[] = [
  { usfm: "GEN", es: "Génesis", en: "Genesis", chapters: 50, testament: "AT" },
  { usfm: "EXO", es: "Éxodo", en: "Exodus", chapters: 40, testament: "AT" },
  { usfm: "LEV", es: "Levítico", en: "Leviticus", chapters: 27, testament: "AT" },
  { usfm: "NUM", es: "Números", en: "Numbers", chapters: 36, testament: "AT" },
  { usfm: "DEU", es: "Deuteronomio", en: "Deuteronomy", chapters: 34, testament: "AT" },
  { usfm: "JOS", es: "Josué", en: "Joshua", chapters: 24, testament: "AT" },
  { usfm: "JDG", es: "Jueces", en: "Judges", chapters: 21, testament: "AT" },
  { usfm: "RUT", es: "Rut", en: "Ruth", chapters: 4, testament: "AT" },
  { usfm: "1SA", es: "1 Samuel", en: "1 Samuel", chapters: 31, testament: "AT" },
  { usfm: "2SA", es: "2 Samuel", en: "2 Samuel", chapters: 24, testament: "AT" },
  { usfm: "1KI", es: "1 Reyes", en: "1 Kings", chapters: 22, testament: "AT" },
  { usfm: "2KI", es: "2 Reyes", en: "2 Kings", chapters: 25, testament: "AT" },
  { usfm: "1CH", es: "1 Crónicas", en: "1 Chronicles", chapters: 29, testament: "AT" },
  { usfm: "2CH", es: "2 Crónicas", en: "2 Chronicles", chapters: 36, testament: "AT" },
  { usfm: "EZR", es: "Esdras", en: "Ezra", chapters: 10, testament: "AT" },
  { usfm: "NEH", es: "Nehemías", en: "Nehemiah", chapters: 13, testament: "AT" },
  { usfm: "EST", es: "Ester", en: "Esther", chapters: 10, testament: "AT" },
  { usfm: "JOB", es: "Job", en: "Job", chapters: 42, testament: "AT" },
  { usfm: "PSA", es: "Salmos", en: "Psalms", chapters: 150, testament: "AT" },
  { usfm: "PRO", es: "Proverbios", en: "Proverbs", chapters: 31, testament: "AT" },
  { usfm: "ECC", es: "Eclesiastés", en: "Ecclesiastes", chapters: 12, testament: "AT" },
  { usfm: "SNG", es: "Cantares", en: "Song of Solomon", chapters: 8, testament: "AT" },
  { usfm: "ISA", es: "Isaías", en: "Isaiah", chapters: 66, testament: "AT" },
  { usfm: "JER", es: "Jeremías", en: "Jeremiah", chapters: 52, testament: "AT" },
  { usfm: "LAM", es: "Lamentaciones", en: "Lamentations", chapters: 5, testament: "AT" },
  { usfm: "EZK", es: "Ezequiel", en: "Ezekiel", chapters: 48, testament: "AT" },
  { usfm: "DAN", es: "Daniel", en: "Daniel", chapters: 12, testament: "AT" },
  { usfm: "HOS", es: "Oseas", en: "Hosea", chapters: 14, testament: "AT" },
  { usfm: "JOL", es: "Joel", en: "Joel", chapters: 3, testament: "AT" },
  { usfm: "AMO", es: "Amós", en: "Amos", chapters: 9, testament: "AT" },
  { usfm: "OBA", es: "Obadías", en: "Obadiah", chapters: 1, testament: "AT" },
  { usfm: "JON", es: "Jonás", en: "Jonah", chapters: 4, testament: "AT" },
  { usfm: "MIC", es: "Miqueas", en: "Micah", chapters: 7, testament: "AT" },
  { usfm: "NAM", es: "Nahúm", en: "Nahum", chapters: 3, testament: "AT" },
  { usfm: "HAB", es: "Habacuc", en: "Habakkuk", chapters: 3, testament: "AT" },
  { usfm: "ZEP", es: "Sofonías", en: "Zephaniah", chapters: 3, testament: "AT" },
  { usfm: "HAG", es: "Hageo", en: "Haggai", chapters: 2, testament: "AT" },
  { usfm: "ZEC", es: "Zacarías", en: "Zechariah", chapters: 14, testament: "AT" },
  { usfm: "MAL", es: "Malaquías", en: "Malachi", chapters: 4, testament: "AT" },
  { usfm: "MAT", es: "Mateo", en: "Matthew", chapters: 28, testament: "NT" },
  { usfm: "MRK", es: "Marcos", en: "Mark", chapters: 16, testament: "NT" },
  { usfm: "LUK", es: "Lucas", en: "Luke", chapters: 24, testament: "NT" },
  { usfm: "JHN", es: "Juan", en: "John", chapters: 21, testament: "NT" },
  { usfm: "ACT", es: "Hechos", en: "Acts", chapters: 28, testament: "NT" },
  { usfm: "ROM", es: "Romanos", en: "Romans", chapters: 16, testament: "NT" },
  { usfm: "1CO", es: "1 Corintios", en: "1 Corinthians", chapters: 16, testament: "NT" },
  { usfm: "2CO", es: "2 Corintios", en: "2 Corinthians", chapters: 13, testament: "NT" },
  { usfm: "GAL", es: "Gálatas", en: "Galatians", chapters: 6, testament: "NT" },
  { usfm: "EPH", es: "Efesios", en: "Ephesians", chapters: 6, testament: "NT" },
  { usfm: "PHP", es: "Filipenses", en: "Philippians", chapters: 4, testament: "NT" },
  { usfm: "COL", es: "Colosenses", en: "Colossians", chapters: 4, testament: "NT" },
  { usfm: "1TH", es: "1 Tesalonicenses", en: "1 Thessalonians", chapters: 5, testament: "NT" },
  { usfm: "2TH", es: "2 Tesalonicenses", en: "2 Thessalonians", chapters: 3, testament: "NT" },
  { usfm: "1TI", es: "1 Timoteo", en: "1 Timothy", chapters: 6, testament: "NT" },
  { usfm: "2TI", es: "2 Timoteo", en: "2 Timothy", chapters: 4, testament: "NT" },
  { usfm: "TIT", es: "Tito", en: "Titus", chapters: 3, testament: "NT" },
  { usfm: "PHM", es: "Filemón", en: "Philemon", chapters: 1, testament: "NT" },
  { usfm: "HEB", es: "Hebreos", en: "Hebrews", chapters: 13, testament: "NT" },
  { usfm: "JAS", es: "Santiago", en: "James", chapters: 5, testament: "NT" },
  { usfm: "1PE", es: "1 Pedro", en: "1 Peter", chapters: 5, testament: "NT" },
  { usfm: "2PE", es: "2 Pedro", en: "2 Peter", chapters: 3, testament: "NT" },
  { usfm: "1JN", es: "1 Juan", en: "1 John", chapters: 5, testament: "NT" },
  { usfm: "2JN", es: "2 Juan", en: "2 John", chapters: 1, testament: "NT" },
  { usfm: "3JN", es: "3 Juan", en: "3 John", chapters: 1, testament: "NT" },
  { usfm: "JUD", es: "Judas", en: "Jude", chapters: 1, testament: "NT" },
  { usfm: "REV", es: "Apocalipsis", en: "Revelation", chapters: 22, testament: "NT" },
];

export const OLD_TESTAMENT = BOOKS.filter((b) => b.testament === "AT");
export const NEW_TESTAMENT = BOOKS.filter((b) => b.testament === "NT");

export function findCatalogBook(usfm: string): CatalogBook | undefined {
  return BOOKS.find((b) => b.usfm === usfm.toUpperCase());
}

export function searchCatalogBooks(query: string): CatalogBook | null {
  const ranked = searchCatalogBooksRanked(query, 1);
  return ranked[0] ?? null;
}

function isSubsequence(q: string, target: string): boolean {
  if (!q) return false;
  let i = 0;
  for (const ch of target) {
    if (ch === q[i]) {
      i += 1;
      if (i >= q.length) return true;
    }
  }
  return i >= q.length;
}

function scoreTarget(q: string, target: string): number {
  if (!q || !target) return -1;
  if (target === q) return 100;
  if (target.startsWith(q)) return 90;
  const words = target.split(" ");
  if (words.some((w) => w.startsWith(q))) return 80;
  if (target.includes(q)) return 70;
  if (q.length >= 2 && isSubsequence(q, target.replace(/[^a-z0-9]/g, ""))) return 55;
  return -1;
}

export function searchCatalogBooksRanked(query: string, limit = 7): CatalogBook[] {
  const q = normalizeBookName(query).replace(/\./g, "");
  if (!q) return [];
  const scored: { book: CatalogBook; score: number }[] = [];
  for (const b of BOOKS) {
    const targets = [
      normalizeBookName(b.es),
      normalizeBookName(b.en),
      b.usfm.toLowerCase(),
    ];
    let best = -1;
    for (const t of targets) {
      const s = scoreTarget(q, t);
      if (s > best) best = s;
    }
    // Bonus: la query con número ("1 jn") debe preferir libros numerados.
    if (best >= 0 && /^[123]/.test(q) && /^[123]/.test(targets[0] ?? "") === false) {
      // sin ajuste, el ranking por score ya lo maneja
    }
    if (best >= 0) scored.push({ book: b, score: best });
  }
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const la = a.book.es.length + a.book.en.length;
    const lb = b.book.es.length + b.book.en.length;
    if (la !== lb) return la - lb;
    return BOOKS.indexOf(a.book) - BOOKS.indexOf(b.book);
  });
  return scored.slice(0, limit).map((s) => s.book);
}

export type RefSuggestion = {
  book: CatalogBook;
  chapter?: number;
  verse?: number;
  verseStr: string;
  label: string;
  sub: string;
  key: string;
  exact: boolean;
};

export function getRefSuggestions(
  raw: string,
  lang: "es" | "en" = "es",
  limit = 7
): RefSuggestion[] {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return [];
  const parts = splitRefQuery(trimmed);
  if (!parts.bookQuery) return [];

  // 1) Coincidencia exacta por alias (ej: "jn", "sal", "1 jn") tiene prioridad.
  const exactCode = findBookByName(parts.bookQuery);
  let candidates: CatalogBook[];
  if (exactCode) {
    const exactBook = findCatalogBook(exactCode);
    const rest = searchCatalogBooksRanked(parts.bookQuery, limit + 3).filter(
      (b) => b.usfm !== exactCode
    );
    candidates = exactBook ? [exactBook, ...rest] : rest;
  } else {
    candidates = searchCatalogBooksRanked(parts.bookQuery, 20);
  }
  if (!candidates.length) return [];

  const chapterNum = parts.chapter;
  const hasChapter = parts.chapterStr !== "" && chapterNum !== undefined;
  const filtered = hasChapter
    ? candidates.filter((b) => chapterNum! >= 1 && chapterNum! <= b.chapters)
    : candidates;

  // Si el capítulo no existe en ningún candidato, muestra los libros igual
  // para que el usuario corrija (ej: "ap 30").
  const list = (filtered.length ? filtered : candidates).slice(0, limit);

  return list.map((book) => {
    const name = lang === "es" ? book.es : book.en;
    let label = name;
    if (hasChapter) label += ` ${chapterNum}`;
    if (parts.hasColon) label += `:${parts.verseStr}`;
    const key = `${book.usfm}-${parts.chapterStr || "0"}-${parts.verseStr || ""}`;
    const chaptersShort = lang === "es" ? "cap." : "ch.";
    return {
      book,
      chapter: hasChapter ? chapterNum : undefined,
      verse: parts.verse,
      verseStr: parts.verseStr,
      label,
      sub: `${book.chapters} ${chaptersShort}`,
      key,
      exact: list.length === 1 && !!exactCode,
    };
  });
}

export function bookLabel(book: CatalogBook, lang: "es" | "en"): string {
  return lang === "es" ? book.es : book.en;
}
