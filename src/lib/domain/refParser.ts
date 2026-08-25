export type ParsedRef = {
  usfm: string;
  bookCode: string;
  bookName: string;
  chapter: number;
  verse?: number;
  verseEnd?: number;
};

const BOOK_CODES: Record<string, string> = {
  genesis: "GEN",
  exodo: "EXO",
  exodus: "EXO",
  levitico: "LEV",
  leviticus: "LEV",
  numeros: "NUM",
  numbers: "NUM",
  deuteronomio: "DEU",
  deuteronomy: "DEU",
  josue: "JOS",
  joshua: "JOS",
  jueces: "JDG",
  judges: "JDG",
  rut: "RUT",
  ruth: "RUT",
  "1 samuel": "1SA",
  "2 samuel": "2SA",
  "1 reyes": "1KI",
  "2 reyes": "2KI",
  "1 kings": "1KI",
  "2 kings": "2KI",
  "1 cronicas": "1CH",
  "2 cronicas": "2CH",
  "1 chronicles": "1CH",
  "2 chronicles": "2CH",
  esdras: "EZR",
  ezra: "EZR",
  nehemias: "NEH",
  nehemiah: "NEH",
  ester: "EST",
  esther: "EST",
  job: "JOB",
  salmo: "PSA",
  salmos: "PSA",
  psalm: "PSA",
  psalms: "PSA",
  proverbios: "PRO",
  proverbs: "PRO",
  eclesiastes: "ECC",
  ecclesiastes: "ECC",
  cantares: "SNG",
  "song of solomon": "SNG",
  isaias: "ISA",
  isaiah: "ISA",
  jeremias: "JER",
  jeremiah: "JER",
  lamentaciones: "LAM",
  lamentations: "LAM",
  ezequiel: "EZK",
  ezekiel: "EZK",
  daniel: "DAN",
  oseas: "HOS",
  hosea: "HOS",
  joel: "JOL",
  amos: "AMO",
  jonas: "JON",
  jonah: "JON",
  miqueas: "MIC",
  micah: "MIC",
  nahum: "NAM",
  habacuc: "HAB",
  habakkuk: "HAB",
  sofonias: "ZEP",
  zephaniah: "ZEP",
  hageo: "HAG",
  haggai: "HAG",
  zacarias: "ZEC",
  zechariah: "ZEC",
  malaquias: "MAL",
  malachi: "MAL",
  mateo: "MAT",
  matthew: "MAT",
  marcos: "MRK",
  mark: "MRK",
  lucas: "LUK",
  luke: "LUK",
  juan: "JHN",
  john: "JHN",
  hechos: "ACT",
  acts: "ACT",
  romanos: "ROM",
  romans: "ROM",
  "1 corintios": "1CO",
  "2 corintios": "2CO",
  "1 corinthians": "1CO",
  "2 corinthians": "2CO",
  galatas: "GAL",
  galatians: "GAL",
  efesios: "EPH",
  ephesians: "EPH",
  filipenses: "PHP",
  philippians: "PHP",
  colosenses: "COL",
  colossians: "COL",
  "1 tesalonicenses": "1TH",
  "2 tesalonicenses": "2TH",
  "1 thessalonians": "1TH",
  "2 thessalonians": "2TH",
  "1 timoteo": "1TI",
  "2 timoteo": "2TI",
  "1 timothy": "1TI",
  "2 timothy": "2TI",
  tito: "TIT",
  titus: "TIT",
  filemon: "PHM",
  philemon: "PHM",
  hebreos: "HEB",
  hebrews: "HEB",
  santiago: "JAS",
  james: "JAS",
  "1 pedro": "1PE",
  "2 pedro": "2PE",
  "1 peter": "1PE",
  "2 peter": "2PE",
  "1 juan": "1JN",
  "2 juan": "2JN",
  "3 juan": "3JN",
  "1 john": "1JN",
  "2 john": "2JN",
  "3 john": "3JN",
  judas: "JUD",
  jude: "JUD",
  apocalipsis: "REV",
  revelation: "REV",
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

  let m = /^(.+?)\s+(\d{1,3}):(\d{1,3})(?:\s*-\s*(\d{1,3}))?$/.exec(cleaned);
  if (m) {
    const name = normalizeBookName(m[1] ?? "");
    const code = BOOK_CODES[name];
    if (!code || !m[2] || !m[3]) return null;
    const chapter = Number(m[2]);
    const verse = Number(m[3]);
    const verseEnd = m[4] ? Number(m[4]) : undefined;
    return { usfm: buildUsfm(code, chapter, verse, verseEnd), bookCode: code, bookName: name, chapter, verse, verseEnd };
  }

  m = /^(.+?)\s+(\d{1,3})$/.exec(cleaned);
  if (m) {
    const name = normalizeBookName(m[1] ?? "");
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
