import type { Lang } from "@/lib/domain/types";

export interface FavoriteVerse {
  key: string;
  ref: string;
  text: string;
  lang: Lang;
  /** Enlace directo para abrir el versículo (ej. /lectura?lang=es&ref=...). */
  url: string;
  savedAt: number;
}

const LS_KEY = "refugio.favorites.v1";
const MAX_FAVORITES = 200;
export const FAVORITES_EVENT = "refugio-favorites-changed";

function storage(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function favoriteKey(lang: Lang, ref: string): string {
  return `${lang}::${ref.trim().toLowerCase()}`;
}

function valid(f: unknown): f is FavoriteVerse {
  if (!f || typeof f !== "object") return false;
  const v = f as Record<string, unknown>;
  return (
    typeof v.key === "string" &&
    typeof v.ref === "string" &&
    typeof v.text === "string" &&
    (v.lang === "es" || v.lang === "en") &&
    typeof v.url === "string"
  );
}

export function getFavorites(): FavoriteVerse[] {
  try {
    const raw = storage()?.getItem(LS_KEY);
    if (!raw) return [];
    const arr: unknown = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(valid).slice(0, MAX_FAVORITES);
  } catch {
    return [];
  }
}

function persist(list: FavoriteVerse[]): void {
  try {
    storage()?.setItem(LS_KEY, JSON.stringify(list.slice(0, MAX_FAVORITES)));
  } catch {
    // almacenamiento no disponible: se ignora sin romper la UI
  }
  try {
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENT));
  } catch {
    // SSR o entorno sin window
  }
}

export function isFavorite(key: string): boolean {
  return getFavorites().some((f) => f.key === key);
}

/** Alterna el favorito. Devuelve `true` si quedó guardado, `false` si se quitó. */
export function toggleFavorite(fav: Omit<FavoriteVerse, "savedAt">): boolean {
  const list = getFavorites();
  const idx = list.findIndex((f) => f.key === fav.key);
  if (idx >= 0) {
    list.splice(idx, 1);
    persist(list);
    return false;
  }
  persist([{ ...fav, savedAt: Date.now() }, ...list]);
  return true;
}

export function removeFavorite(key: string): void {
  persist(getFavorites().filter((f) => f.key !== key));
}
