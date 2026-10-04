export const SANCTUARY_LS_KEY = "refugio-celestial:sanctuary-theme";

export type SanctuaryTheme = "celestial" | "nature";

export function getStoredSanctuary(): SanctuaryTheme {
  if (typeof window === "undefined") return "celestial";
  return localStorage.getItem(SANCTUARY_LS_KEY) === "nature"
    ? "nature"
    : "celestial";
}
