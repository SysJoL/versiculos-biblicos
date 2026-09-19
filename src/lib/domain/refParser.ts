export type ParsedRef = {
  usfm: string;
  bookCode: string;
  bookName: string;
  chapter: number;
  verse?: number;
  verseEnd?: number;
};

const BOOK_CODES: Record<string, string> = {
  gen: "GEN",
  gn: "GEN",
  ge: "GEN",
  genesis: "GEN",
  exo: "EXO",
  ex: "EXO",
  exod: "EXO",
  exodo: "EXO",
  exodus: "EXO",
  lev: "LEV",
  lv: "LEV",
  le: "LEV",
  levitico: "LEV",
  leviticus: "LEV",
  num: "NUM",
  nm: "NUM",
  numeros: "NUM",
  numbers: "NUM",
  deut: "DEU",
  dt: "DEU",
  deu: "DEU",
  deuteronomio: "DEU",
  deuteronomy: "DEU",
  jos: "JOS",
  josh: "JOS",
  josue: "JOS",
  joshua: "JOS",
  jue: "JDG",
  jdg: "JDG",
  judges: "JDG",
  judg: "JDG",
  jueces: "JDG",
  rut: "RUT",
  rt: "RUT",
  ruth: "RUT",
  "1 samuel": "1SA",
  "1 sam": "1SA",
  "1sam": "1SA",
  "1sa": "1SA",
  "1 sm": "1SA",
  "2 samuel": "2SA",
  "2 sam": "2SA",
  "2sam": "2SA",
  "2sa": "2SA",
  "2 sm": "2SA",
  "1 reyes": "1KI",
  "1 rey": "1KI",
  "1re": "1KI",
  "1 kings": "1KI",
  "1 kgs": "1KI",
  "1kgs": "1KI",
  "1ki": "1KI",
  "2 reyes": "2KI",
  "2 rey": "2KI",
  "2re": "2KI",
  "2 kings": "2KI",
  "2 kgs": "2KI",
  "2kgs": "2KI",
  "2ki": "2KI",
  "1 cronicas": "1CH",
  "1 cron": "1CH",
  "1cro": "1CH",
  "1 chronicles": "1CH",
  "1 chr": "1CH",
  "1chr": "1CH",
  "1ch": "1CH",
  "2 cronicas": "2CH",
  "2 cron": "2CH",
  "2cro": "2CH",
  "2 chronicles": "2CH",
  "2 chr": "2CH",
  "2chr": "2CH",
  "2ch": "2CH",
  esd: "EZR",
  esdras: "EZR",
  ezra: "EZR",
  ezr: "EZR",
  neh: "NEH",
  ne: "NEH",
  nehemias: "NEH",
  nehemiah: "NEH",
  est: "EST",
  ester: "EST",
  esther: "EST",
  esth: "EST",
  job: "JOB",
  jb: "JOB",
  sal: "PSA",
  salm: "PSA",
  salmo: "PSA",
  salmos: "PSA",
  sl: "PSA",
  ps: "PSA",
  psa: "PSA",
  psalm: "PSA",
  psalms: "PSA",
  prov: "PRO",
  pro: "PRO",
  pr: "PRO",
  prv: "PRO",
  proverbios: "PRO",
  proverbs: "PRO",
  provs: "PRO",
  ecl: "ECC",
  ec: "ECC",
  ecc: "ECC",
  eclesiastes: "ECC",
  ecclesiastes: "ECC",
  eccl: "ECC",
  cant: "SNG",
  cantares: "SNG",
  ct: "SNG",
  sng: "SNG",
  "song of solomon": "SNG",
  song: "SNG",
  isa: "ISA",
  is: "ISA",
  isaias: "ISA",
  isaiah: "ISA",
  jer: "JER",
  je: "JER",
  jeremias: "JER",
  jeremiah: "JER",
  lam: "LAM",
  lm: "LAM",
  lamentaciones: "LAM",
  lamentations: "LAM",
  eze: "EZK",
  ez: "EZK",
  ezk: "EZK",
  ezequiel: "EZK",
  ezekiel: "EZK",
  ezek: "EZK",
  dan: "DAN",
  dn: "DAN",
  daniel: "DAN",
  os: "HOS",
  oseas: "HOS",
  hos: "HOS",
  hosea: "HOS",
  jl: "JOL",
  joel: "JOL",
  am: "AMO",
  amos: "AMO",
  abd: "OBA",
  ob: "OBA",
  oba: "OBA",
  obadias: "OBA",
  abdias: "OBA",
  obadiah: "OBA",
  obad: "OBA",
  jon: "JON",
  jonas: "JON",
  jonah: "JON",
  miq: "MIC",
  mi: "MIC",
  mic: "MIC",
  miqueas: "MIC",
  micah: "MIC",
  nah: "NAM",
  nam: "NAM",
  nahum: "NAM",
  hab: "HAB",
  habacuc: "HAB",
  habakkuk: "HAB",
  sof: "ZEP",
  sofonias: "ZEP",
  zephaniah: "ZEP",
  zeph: "ZEP",
  hag: "HAG",
  hageo: "HAG",
  haggai: "HAG",
  zac: "ZEC",
  zec: "ZEC",
  zacarias: "ZEC",
  zechariah: "ZEC",
  zech: "ZEC",
  mal: "MAL",
  malaquias: "MAL",
  malachi: "MAL",
  mt: "MAT",
  mat: "MAT",
  mateo: "MAT",
  matthew: "MAT",
  matt: "MAT",
  mc: "MRK",
  mr: "MRK",
  mrk: "MRK",
  marcos: "MRK",
  mark: "MRK",
  lc: "LUK",
  lk: "LUK",
  luk: "LUK",
  lucas: "LUK",
  luke: "LUK",
  jn: "JHN",
  jhn: "JHN",
  juan: "JHN",
  john: "JHN",
  hch: "ACT",
  hech: "ACT",
  hechos: "ACT",
  acts: "ACT",
  act: "ACT",
  rom: "ROM",
  ro: "ROM",
  romanos: "ROM",
  romans: "ROM",
  "1 corintios": "1CO",
  "1 cor": "1CO",
  "1cor": "1CO",
  "1co": "1CO",
  "1 corinthians": "1CO",
  "2 corintios": "2CO",
  "2 cor": "2CO",
  "2cor": "2CO",
  "2co": "2CO",
  "2 corinthians": "2CO",
  gal: "GAL",
  ga: "GAL",
  galatas: "GAL",
  galatians: "GAL",
  efe: "EPH",
  ef: "EPH",
  efesios: "EPH",
  ephesians: "EPH",
  eph: "EPH",
  fil: "PHP",
  filipenses: "PHP",
  philippians: "PHP",
  phil: "PHP",
  php: "PHP",
  col: "COL",
  colosenses: "COL",
  colossians: "COL",
  "1 tesalonicenses": "1TH",
  "1 tes": "1TH",
  "1tes": "1TH",
  "1 thessalonians": "1TH",
  "1 thess": "1TH",
  "1thess": "1TH",
  "1th": "1TH",
  "2 tesalonicenses": "2TH",
  "2 tes": "2TH",
  "2tes": "2TH",
  "2 thessalonians": "2TH",
  "2 thess": "2TH",
  "2thess": "2TH",
  "2th": "2TH",
  "1 timoteo": "1TI",
  "1 tim": "1TI",
  "1tim": "1TI",
  "1 timothy": "1TI",
  "1ti": "1TI",
  "2 timoteo": "2TI",
  "2 tim": "2TI",
  "2tim": "2TI",
  "2 timothy": "2TI",
  "2ti": "2TI",
  tit: "TIT",
  tito: "TIT",
  titus: "TIT",
  flm: "PHM",
  filemon: "PHM",
  philemon: "PHM",
  philem: "PHM",
  phm: "PHM",
  heb: "HEB",
  he: "HEB",
  hebreos: "HEB",
  hebrews: "HEB",
  sant: "JAS",
  stg: "JAS",
  santiago: "JAS",
  james: "JAS",
  jas: "JAS",
  "1 pedro": "1PE",
  "1 pe": "1PE",
  "1pe": "1PE",
  "1 peter": "1PE",
  "1 pet": "1PE",
  "1pet": "1PE",
  "2 pedro": "2PE",
  "2 pe": "2PE",
  "2pe": "2PE",
  "2 peter": "2PE",
  "2 pet": "2PE",
  "2pet": "2PE",
  "1 juan": "1JN",
  "1 jn": "1JN",
  "1jn": "1JN",
  "1 john": "1JN",
  "2 juan": "2JN",
  "2 jn": "2JN",
  "2jn": "2JN",
  "2 john": "2JN",
  "3 juan": "3JN",
  "3 jn": "3JN",
  "3jn": "3JN",
  "3 john": "3JN",
  jud: "JUD",
  judas: "JUD",
  jude: "JUD",
  jd: "JUD",
  apo: "REV",
  ap: "REV",
  apoc: "REV",
  apocalipsis: "REV",
  revelation: "REV",
  rev: "REV",
};

export function normalizeBookName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function buildUsfm(
  code: string,
  chapter: number,
  verse?: number,
  verseEnd?: number
): string {
  const base = `${code}.${chapter}`;
  if (!verse) return base;
  if (verseEnd && verseEnd !== verse) {
    return `${base}.${verse}-${base}.${verseEnd}`;
  }
  return `${base}.${verse}`;
}

export function parseRef(input: string): ParsedRef | null {
  const cleaned = input.trim().replace(/\s+/g, " ");
  if (!cleaned) return null;

  let m = /^(.+?)\s*(\d{1,3})\s*:\s*(\d{1,3})(?:\s*-\s*(\d{1,3}))?$/.exec(cleaned);
  if (m) {
    const name = normalizeBookName((m[1] ?? "").trim());
    if (!name) return null;
    const code = BOOK_CODES[name];
    if (!code || !m[2] || !m[3]) return null;
    const chapter = Number(m[2]);
    const verse = Number(m[3]);
    const verseEnd = m[4] ? Number(m[4]) : undefined;
    return { usfm: buildUsfm(code, chapter, verse, verseEnd), bookCode: code, bookName: name, chapter, verse, verseEnd };
  }

  m = /^(.+?)\s*(\d{1,3})$/.exec(cleaned);
  if (m) {
    const name = normalizeBookName((m[1] ?? "").trim());
    if (!name) return null;
    const code = BOOK_CODES[name];
    if (!code || !m[2]) return null;
    const chapter = Number(m[2]);
    return { usfm: buildUsfm(code, chapter), bookCode: code, bookName: name, chapter };
  }

  const name = normalizeBookName(cleaned);
  const code = BOOK_CODES[name];
  if (code) {
    return { usfm: buildUsfm(code, 1), bookCode: code, bookName: name, chapter: 1 };
  }

  return null;
}

export function parseRefToUsfm(ref: string): string | null {
  return parseRef(ref)?.usfm ?? null;
}

export function findBookByName(input: string): string | null {
  return BOOK_CODES[normalizeBookName(input)] ?? null;
}

export type PartialRef = {
  bookQuery: string;
  chapter?: number;
  chapterStr: string;
  verseStr: string;
  verse?: number;
  hasColon: boolean;
};

/** Divide "juan 3:1", "jn3", "sal 23", "1 jn" en partes para autocomplete. */
export function splitRefQuery(input: string): PartialRef {
  const cleaned = input.trim().replace(/\s+/g, " ");
  const empty: PartialRef = {
    bookQuery: cleaned,
    chapterStr: "",
    verseStr: "",
    hasColon: false,
  };
  if (!cleaned) return empty;

  const colonIdx = cleaned.indexOf(":");
  if (colonIdx >= 0) {
    const left = cleaned.slice(0, colonIdx).trim();
    const right = cleaned.slice(colonIdx + 1).trim();
    const lm = /^(.*?)\s*(\d{1,3})?$/.exec(left) ?? null;
    const bookQuery = (lm?.[1] ?? left).trim();
    const chapterStr = lm?.[2] ?? "";
    const vm = /^(\d{0,3})(?:\s*-\s*(\d{0,3}))?$/.exec(right) ?? null;
    const verseStr = vm?.[1] ?? right;
    return {
      bookQuery,
      chapter: chapterStr ? Number(chapterStr) : undefined,
      chapterStr,
      verseStr,
      verse: verseStr && /^\d+$/.test(verseStr) ? Number(verseStr) : undefined,
      hasColon: true,
    };
  }

  const m = /^(.*?)\s*(\d{1,3})?$/.exec(cleaned);
  if (!m) return empty;
  const bookQuery = (m[1] ?? "").trim();
  const chapterStr = m[2] ?? "";
  // Si todo es número ("23") no hay libro.
  if (!bookQuery && chapterStr) {
    return { bookQuery: "", chapterStr, verseStr: "", hasColon: false };
  }
  return {
    bookQuery,
    chapter: chapterStr ? Number(chapterStr) : undefined,
    chapterStr,
    verseStr: "",
    hasColon: false,
  };
}
