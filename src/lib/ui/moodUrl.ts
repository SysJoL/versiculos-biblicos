import type { Lang, Mood } from "@/lib/domain/types";

/**
 * Devuelve path + query con `lang` y `mood` actualizados, conservando el resto
 * de parámetros. Se usa con `history.replaceState` al cambiar de categoría
 * desde el card, para que recargar o compartir la URL mantenga el filtro.
 */
export function withMoodParam(href: string, lang: Lang, mood: Mood): string {
  const url = new URL(href, "https://refugio.local");
  url.searchParams.set("lang", lang);
  url.searchParams.set("mood", mood);
  return `${url.pathname}${url.search}${url.hash}`;
}
