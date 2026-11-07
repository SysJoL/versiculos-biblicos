import type { Lang } from "@/lib/domain/types";

/**
 * Enlace al lector bíblico para un versículo concreto, en el idioma de la
 * tarjeta. `/lectura` parsea `ref` en el servidor y abre el capítulo con el
 * versículo resaltado (ver `BibleReader.readInitial`).
 */
export function bibleReaderHref(ref: string, lang: Lang): string {
  return `/lectura?lang=${lang}&ref=${encodeURIComponent(ref.trim())}`;
}
