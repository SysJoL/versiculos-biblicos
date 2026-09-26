/** Búsqueda por palabras/frase sin IA: normalización + scoring simple. */

const STOP_ES = new Set([
  "en", "el", "la", "los", "las", "de", "del", "y", "o", "u", "que",
  "con", "por", "para", "como", "una", "uno", "un", "se", "su", "sus",
  "al", "lo", "le", "les", "me", "mi", "mis", "te", "tu", "tus", "nos",
  "mas", "muy", "sin", "sobre", "entre", "cuando", "donde", "quien",
]);

const STOP_EN = new Set([
  "in", "the", "a", "an", "and", "or", "of", "to", "for", "with",
  "on", "at", "by", "from", "that", "who", "whom", "which", "is",
  "are", "was", "were", "be", "been", "he", "she", "it", "they",
  "his", "her", "its", "their", "as", "but", "not", "no", "so",
]);

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9n ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(
  value: string,
  lang: "es" | "en" = "es"
): string[] {
  const norm = normalizeText(value);
  if (!norm) return [];
  const stops = lang === "es" ? STOP_ES : STOP_EN;
  return norm.split(" ").filter((w) => w.length >= 2 && !stops.has(w));
}

/**
 * Puntaje 0-100+:
 * - frase exacta normalizada contenida: +100
 * - todas las palabras presentes: +70
 * - si no, +12 por palabra coincidente (máx. parcial)
 * Bonus leve a textos cortos (versículos) frente a capítulos largos.
 */
export function scoreText(
  query: string,
  haystack: string,
  lang: "es" | "en" = "es"
): number {
  const qNorm = normalizeText(query);
  const hNorm = normalizeText(haystack);
  if (!qNorm || !hNorm) return 0;
  if (hNorm.includes(qNorm) && qNorm.length >= 4) return 100;

  const qWords = tokenize(query, lang);
  if (qWords.length === 0) return 0;
  const hSet = new Set(hNorm.split(" "));
  let hits = 0;
  for (const w of qWords) {
    if (hSet.has(w)) hits += 1;
  }
  if (hits === 0) return 0;
  if (hits === qWords.length) {
    // Todas presentes aunque desordenadas: bueno, pero menos que frase exacta.
    const bonus = hNorm.length <= 320 ? 8 : 0;
    return 70 + bonus;
  }
  return Math.min(hits * 12, 60);
}
