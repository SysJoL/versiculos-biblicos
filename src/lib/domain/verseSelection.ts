/**
 * Helpers for choosing verse references without repeating the same small set.
 *
 * The category flow used to sample hints from a fixed 15-ref catalog, so the
 * user effectively saw the same verses over and over. These helpers combine the
 * full local category pool with the curated catalog and keep the "avoid recent
 * refs" rule, falling back to the whole pool instead of returning nothing when
 * every reference was recently shown.
 */

export function normalizeRef(ref: string): string {
  return ref
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export type HintRefsOptions = {
  localRefs: Iterable<string>;
  catalogRefs?: Iterable<string>;
  avoidRefs?: Iterable<string>;
  count: number;
  rng?: () => number;
};

function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Pick `count` unique hints, preferring refs that were not shown recently. */
export function buildHintRefs({
  localRefs,
  catalogRefs = [],
  avoidRefs = [],
  count,
  rng = Math.random,
}: HintRefsOptions): string[] {
  const seen = new Set<string>();
  const pool: string[] = [];
  for (const ref of [...localRefs, ...catalogRefs]) {
    const key = normalizeRef(ref);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    pool.push(ref);
  }

  if (pool.length === 0 || count <= 0) return [];

  const avoid = new Set<string>();
  for (const ref of avoidRefs) avoid.add(normalizeRef(ref));
  const candidates = pool.filter((ref) => !avoid.has(normalizeRef(ref)));
  const source = candidates.length > 0 ? candidates : pool;

  return shuffled(source, rng).slice(0, Math.min(count, source.length));
}

/** Pick one item uniformly at random (null for an empty list). */
export function pickRandom<T>(
  items: readonly T[],
  rng: () => number = Math.random
): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(rng() * items.length)] ?? null;
}
