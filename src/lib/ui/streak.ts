const LS_KEY = "refugio.streak.v1";

export interface StreakState {
  count: number;
  /** `true` solo la primera visita del día cuando la racha avanzó. */
  incremented: boolean;
}

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function readStored(): { last: string; count: number } | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { last?: unknown; count?: unknown };
    if (typeof v.last !== "string" || typeof v.count !== "number") return null;
    return { last: v.last, count: Math.max(0, Math.floor(v.count)) };
  } catch {
    return null;
  }
}

/**
 * Registra la visita de hoy. La racha sube si ayer hubo visita;
 * se reinicia a 1 si hubo un hueco mayor a un día.
 */
export function recordVisit(): StreakState {
  const today = new Date();
  const todayKey = dayKey(today);
  const yesterdayKey = dayKey(new Date(today.getTime() - 24 * 60 * 60 * 1000));
  const stored = readStored();

  if (stored && stored.last === todayKey) {
    return { count: Math.max(1, stored.count), incremented: false };
  }

  const count = stored && stored.last === yesterdayKey ? stored.count + 1 : 1;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify({ last: todayKey, count }));
  } catch {
    // almacenamiento no disponible: se muestra la racha sin persistir
  }
  return { count, incremented: count > 1 };
}

export function getStreak(): number {
  return readStored()?.count ?? 0;
}
