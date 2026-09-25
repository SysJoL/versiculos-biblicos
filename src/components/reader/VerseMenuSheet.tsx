import type { Lang } from "@/lib/domain/types";
import type { SanctuaryTheme } from "@/lib/ui/sanctuary";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useVerseMenuActions } from "./useVerseMenuActions";

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
  const d = busy;

  const itemClass = `flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left text-sm font-medium text-gold-100/95 transition disabled:opacity-60 ${itemBorder}`;
  const iconChip =
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-inset ring-white/10";

  return (
    <BottomSheet
      isOpen={isOpen}
      title={t.title}
      onClose={onClose}
      closeLabel={t.close}
      maxHeightClassName="max-h-[72dvh] md:max-h-[82vh]"
      sanctuary={sanctuary}
    >
      <div className="w-[calc(100vw-2.5rem)] max-w-[28rem] space-y-2">
        <button
          type="button"
          role="menuitem"
          onClick={onExport}
          disabled={d}
          className={itemClass}
        >
          <span className={iconChip}>
            {busy ? (
              <i className="fa-solid fa-spinner fa-spin" aria-hidden />
            ) : (
              <i className={`fa-solid fa-download ${iconColor}`} aria-hidden />
            )}
          </span>
          {t.exportImage}
        </button>
        {canCopyImage ? (
          <button
            type="button"
            role="menuitem"
            onClick={onCopyImage}
            disabled={d}
            className={itemClass}
          >
            <span className={iconChip}>
              <i className={`fa-solid fa-file-image ${iconColor}`} aria-hidden />
            </span>
            {t.copyImage}
          </button>
        ) : null}
        <button
          type="button"
          role="menuitem"
          onClick={onCopyVerse}
          disabled={d}
          className={itemClass}
        >
          <span className={iconChip}>
            <i className={`fa-solid fa-quote-left ${iconColor}`} aria-hidden />
          </span>
          {t.copyVerse}
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={onCopyLink}
          disabled={d}
          className={itemClass}
        >
          <span className={iconChip}>
            <i className={`fa-solid fa-link ${iconColor}`} aria-hidden />
          </span>
          {t.copyLink}
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={onToggleFavorite}
          disabled={d}
          className={itemClass}
          aria-pressed={isFav}
        >
          <span className={iconChip}>
            <i className={`fa-${isFav ? "solid" : "regular"} fa-heart ${isFav ? "text-rose-300" : iconColor}`} aria-hidden />
          </span>
          {isFav ? t.unfavorite : t.favorite}
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={onShare}
          disabled={d}
          className={itemClass}
        >
          <span className={iconChip}>
            <i className={`fa-solid fa-share-nodes ${iconColor}`} aria-hidden />
          </span>
          {t.share}
        </button>
      </div>
    </BottomSheet>
  );
}
