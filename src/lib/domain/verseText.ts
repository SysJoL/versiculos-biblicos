/**
 * Normalizes verse text coming from the remote Bible APIs.
 *
 * api.bible returns inline markup even when `content-type=text`, and the old
 * sanitizer replaced every tag with a space, which broke words and detached
 * punctuation:
 *
 *   "S<span>eñor</span>"          -> "S eñor"
 *   "T<i>endré</i>"                -> "T endré"
 *   "misericordia<span>,</span>"   -> "misericordia ,"
 *
 * Inline tags are formatting only, so they must disappear without leaving a
 * gap; only block boundaries deserve whitespace.
 */

export type CleanVerseTextOptions = {
  /** Keep the line breaks produced by <br> (used by the reading view). */
  preserveNewlines?: boolean;
};

const ZERO_WIDTH = /[\u200B-\u200D\u2060\uFEFF]/g;
const UNICODE_SPACES = /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g;
/** api.bible's text mode marks paragraph starts with a pilcrow. */
const PARAGRAPH_MARK = /\u00B6/g;
const BLOCK_TAG =
  /<\/?(?:p|div|li|ul|ol|blockquote|h[1-6]|tr|td|th|table|section|article)\b[^>]*>/gi;

/** Verse/footnote number markers the API leaves in the text, e.g. "[16]". */
const NUMBER_MARKER = /[ \t]*\[\d+\][ \t]*/g;

/**
 * A lone capital consonant followed by a lowercase fragment is a word the
 * source split around markup ("S eñor" -> "Señor", "T endré" -> "Tendré").
 * Vowels and "Y" are excluded so valid one-letter words ("A él", "Y si",
 * "O tú", "E" ) are never joined.
 */
const SPLIT_WORD =
  /\b([B-DF-HJ-NP-TVWXZÁÉÍÓÚÑ])\s+([a-záéíóúüñ]{2,})/g;

export function cleanVerseText(
  value: string,
  options: CleanVerseTextOptions = {}
): string {
  const { preserveNewlines = false } = options;

  let text = value.replace(ZERO_WIDTH, "");
  text = text.replace(/<br\s*\/?>/gi, preserveNewlines ? "\n" : " ");
  text = text.replace(BLOCK_TAG, " ");
  // Remaining tags are inline (<i>, <b>, <span>, <sup>...): drop, never gap.
  text = text.replace(/<[^>]+>/g, "");
  text = text.replace(UNICODE_SPACES, " ");
  text = text.replace(PARAGRAPH_MARK, " ");
  text = text.replace(NUMBER_MARKER, " ");

  text = text.replace(SPLIT_WORD, (match, head: string, rest: string) =>
    /[áéíóúüñ]/.test(rest) ? `${head}${rest}` : match
  );

  // Gaps before punctuation and after opening marks left by the markup.
  text = text.replace(/[ \t]+([,.;:!?%»”’)\]}…])/g, "$1");
  text = text.replace(/([«“¡¿([{])\s+/g, "$1");

  if (!preserveNewlines) {
    return text.replace(/\s+/g, " ").trim();
  }

  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}
