import type { Lang } from "@/lib/domain/types";
import { BiblePanel } from "./BiblePanel";

type Props = {
  initialLang?: Lang;
  initialRef?: string | null;
  /** La página puede renderizar el título fuera del panel. */
  showTitle?: boolean;
};

/**
 * Lector de un solo panel (`/lectura`). Toda la implementación vive en
 * `BiblePanel`, que también reutiliza la vista comparada.
 */
export function BibleReader({
  initialLang = "es",
  initialRef = null,
  showTitle = true,
}: Props) {
  return (
    <BiblePanel
      initialLang={initialLang}
      initialRef={initialRef}
      showTitle={showTitle}
    />
  );
}
