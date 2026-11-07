import type { Mood } from "@/lib/domain/types";

export type MoodOption = {
  id: Mood;
  /** Icono Font Awesome (sin el prefijo `fa-solid`). */
  icon: string;
};

/** Orden y iconos de las categorías usadas por el chip del card. */
export const MOOD_OPTIONS: readonly MoodOption[] = [
  { id: "all", icon: "fa-infinity" },
  { id: "comfort", icon: "fa-dove" },
  { id: "wisdom", icon: "fa-lightbulb" },
  { id: "hope", icon: "fa-seedling" },
  { id: "love", icon: "fa-heart" },
  { id: "repentance", icon: "fa-hands-praying" },
];
