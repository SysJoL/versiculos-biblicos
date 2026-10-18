import type { Lang } from "../domain/types";

/**
 * Normaliza el parámetro `?lang` de la URL al idioma soportado.
 * Cualquier valor distinto de "en" cae a "es" (idioma por defecto).
 */
export function parseLang(value: string | null | undefined): Lang {
  return value === "en" ? "en" : "es";
}
