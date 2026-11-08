import type { Lang } from "../domain/types.ts";
import { parseRef } from "../domain/refParser.ts";
import {
  findCatalogBook,
  type CatalogBook,
} from "../data/booksCatalog.ts";

/**
 * Pasaje compartido por los paneles del lector. Es la única fuente de verdad
 * cuando la vista es comparada: ambos paneles navegan al mismo libro,
 * capítulo y versículo.
 */
export type ReaderRef = {
  testament: "AT" | "NT" | null;
  book: CatalogBook | null;
  chapter: number | null;
  verse?: number;
};

export function emptyReaderRef(): ReaderRef {
  return { testament: null, book: null, chapter: null, verse: undefined };
}

/**
 * Convierte el `?ref=` de la URL en estado del lector. Acepta referencias en
 * español o inglés ("Juan 3:16", "John 3") y limita el capítulo al total del
 * libro. Cualquier texto inválido devuelve el estado vacío.
 */
export function readReaderRef(refText: string | null): ReaderRef {
  if (!refText) return emptyReaderRef();
  const parsed = parseRef(refText);
  if (!parsed) return emptyReaderRef();
  const found = findCatalogBook(parsed.bookCode);
  if (!found) return emptyReaderRef();
  const chapter = Math.min(Math.max(parsed.chapter, 1), found.chapters);
  return {
    testament: found.testament,
    book: found,
    chapter,
    verse: parsed.verse && parsed.verse >= 1 ? parsed.verse : undefined,
  };
}

/**
 * URL canónica de la vista comparada. Usa el nombre español del libro, igual
 * que el lector de `/lectura`, para que el enlace sea legible y compartible.
 */
export function compareHref(ref: ReaderRef, base = "/comparar"): string {
  if (!ref.book || !ref.chapter) return base;
  const q = new URLSearchParams();
  q.set(
    "ref",
    `${ref.book.es} ${ref.chapter}${ref.verse ? `:${ref.verse}` : ""}`.toLowerCase(),
  );
  return `${base}?${q.toString()}`;
}

/** Añade `lang` a la URL de comparar cuando se quiere conservar el idioma de la UI. */
export function compareHrefForLang(
  ref: ReaderRef,
  lang: Lang,
  base = "/comparar",
): string {
  const href = compareHref(ref, base);
  const q = new URLSearchParams(href.split("?")[1] ?? "");
  q.set("lang", lang);
  return `${base}?${q.toString()}`;
}
