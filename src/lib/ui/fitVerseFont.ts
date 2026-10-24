/**
 * Ajuste de la fuente del versículo dentro de la imagen cuadrada.
 *
 * El tamaño no se decide por número de caracteres: se mide el alto real del
 * texto renderizado y se baja la fuente solo lo necesario. Así los versículos
 * largos nunca desbordan el lienzo ni se recortan.
 */

/** Lado del lienzo final (1080 × 1080). */
export const VERSE_SQUARE_SIZE = 1080;

/**
 * Alto máximo del bloque completo (logo + texto + referencia + separador +
 * pie) dentro del marco interior. Deja ~100 px de aire arriba y abajo.
 */
export const VERSE_SAFE_ZONE_HEIGHT = 880;

/**
 * Alto fijo del resto del bloque, ya medido en producción:
 * logo 116 + margen 36 + referencia 60 + margen 36 + separador 36 + pie 64.
 */
export const VERSE_CHROME_HEIGHT = 348;

/** Alto disponible para el texto del versículo. */
export const VERSE_TEXT_MAX_HEIGHT = VERSE_SAFE_ZONE_HEIGHT - VERSE_CHROME_HEIGHT;

/** Ancho del bloque de contenido (lienzo menos 340 px de márgenes). */
export const VERSE_TEXT_WIDTH = VERSE_SQUARE_SIZE - 340;

/** Fuente máxima: versículos cortos, protagonistas de la imagen. */
export const VERSE_FONT_MAX = 58;

/** Fuente mínima: el texto sigue siendo legible en pantallas pequeñas. */
export const VERSE_FONT_MIN = 24;

export type FitVerseFontOptions = {
  max?: number;
  min?: number;
  maxHeight?: number;
};

/**
 * Devuelve el mayor tamaño de fuente (en px enteros) cuyo alto medido cabe en
 * `maxHeight`. `measure` debe devolver el alto real del texto para un tamaño,
 * normalmente leyendo el DOM. La búsqueda es binaria: ~6 mediciones para el
 * rango 24–58 px.
 *
 * Si ni siquiera el mínimo cabe, devuelve el mínimo: es preferible una imagen
 * con el texto apretado a una imagen con el versículo recortado.
 */
export function fitVerseFontSize(
  measure: (fontSize: number) => number,
  options: FitVerseFontOptions = {}
): number {
  const max = Math.round(options.max ?? VERSE_FONT_MAX);
  const min = Math.round(options.min ?? VERSE_FONT_MIN);
  const maxHeight = options.maxHeight ?? VERSE_TEXT_MAX_HEIGHT;

  if (max < min) return min;

  let lo = min;
  let hi = max;
  let best = min;

  while (lo <= hi) {
    const size = Math.floor((lo + hi) / 2);
    if (measure(size) <= maxHeight) {
      best = size;
      lo = size + 1;
    } else {
      hi = size - 1;
    }
  }

  return best;
}
