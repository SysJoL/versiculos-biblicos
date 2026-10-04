import type { Lang } from "@/lib/domain/types";
import type { SanctuaryTheme } from "@/lib/ui/sanctuary";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useVerseMenuActions } from "./useVerseMenuActions";
import { VerseActionItems } from "./VerseActionItems";

type Props = {
  isOpen: boolean;
  lang: Lang;
  sanctuary: SanctuaryTheme;
  /** Etiqueta visible del versículo, ej: "Juan 3:16". */
  verseRefLabel: string;
  verseText: string;
  /** URL directa al versículo (incluye ?lang=&ref=). */
  verseUrl: string;
  onClose: () => void;
};

/**
 * Acciones del versículo en bottom sheet (móvil) / modal centrado (PC).
 * Mismas 5 acciones que el popover de clic derecho.
 */
export function VerseMenuSheet({
  isOpen,
  lang,
  sanctuary,
  verseRefLabel,
  verseText,
  verseUrl,
  onClose,
}: Props) {
  const {
    t,
    busy,
    canCopyImage,
    isFav,
    onExport,
    onCopyImage,
    onCopyVerse,
    onCopyLink,
    onToggleFavorite,
    onShare,
  } = useVerseMenuActions({ lang, verseRefLabel, verseText, verseUrl, onClose });

  const isNature = sanctuary === "nature";
  const itemBorder = isNature
    ? "border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10"
    : "border-gold-500/30 bg-gold-500/5 hover:bg-gold-500/10";
  const iconColor = isNature ? "text-emerald-300/90" : "text-gold-300/90";

  return (
    <BottomSheet
      isOpen={isOpen}
      title={t.title}
      onClose={onClose}
      closeLabel={t.close}
      maxHeightClassName="max-h-[72dvh] md:max-h-[82vh]"
      panelClassName="md:max-w-lg"
      sanctuary={sanctuary}
    >
      <div className="refugio-thin-scroll w-full max-w-[26rem] overflow-y-auto md:max-w-[30rem]">
        <VerseActionItems
          t={t}
          busy={busy}
          canCopyImage={canCopyImage}
          isFav={isFav}
          iconColor={iconColor}
          itemBorder={itemBorder}
          onExport={onExport}
          onCopyImage={onCopyImage}
          onCopyVerse={onCopyVerse}
          onCopyLink={onCopyLink}
          onToggleFavorite={onToggleFavorite}
          onShare={onShare}
        />
      </div>
    </BottomSheet>
  );
}
