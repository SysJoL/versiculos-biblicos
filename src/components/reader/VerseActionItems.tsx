import type { VerseMenuLabels } from "./useVerseMenuActions";

type Props = {
  t: VerseMenuLabels;
  busy: boolean;
  canCopyImage: boolean;
  isFav: boolean;
  iconColor: string;
  itemBorder: string;
  onExport: () => void;
  onCopyImage: () => void;
  onCopyVerse: () => void;
  onCopyLink: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
};

/**
 * Tarjetas de acción del versículo: icono arriba, texto abajo.
 * Móvil: grid 2 col · PC: grid 3 col. Sin listas verticales.
 */
export function VerseActionItems({
  t,
  busy,
  canCopyImage,
  isFav,
  iconColor,
  itemBorder,
  onExport,
  onCopyImage,
  onCopyVerse,
  onCopyLink,
  onToggleFavorite,
  onShare,
}: Props) {
  const d = busy;
  const itemClass = `focus-ring flex min-h-[96px] w-full flex-col items-center justify-center gap-2 rounded-xl border px-2 py-4 text-center text-xs font-medium leading-tight text-gold-100/95 transition disabled:opacity-60 md:min-h-[112px] md:text-[13px] ${itemBorder}`;
  const iconChip =
    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-inset ring-white/10";

  return (
    <div className="grid w-full grid-cols-2 gap-2 md:grid-cols-3" role="none">
      <button type="button" role="menuitem" onClick={onExport} disabled={d} className={itemClass}>
        <span className={iconChip}>
          {busy ? (
            <i className="fa-solid fa-spinner fa-spin" aria-hidden />
          ) : (
            <i className={`fa-solid fa-download ${iconColor}`} aria-hidden />
          )}
        </span>
        <span>{t.exportImage}</span>
      </button>
      {canCopyImage ? (
        <button type="button" role="menuitem" onClick={onCopyImage} disabled={d} className={itemClass}>
          <span className={iconChip}>
            <i className={`fa-solid fa-file-image ${iconColor}`} aria-hidden />
          </span>
          <span>{t.copyImage}</span>
        </button>
      ) : null}
      <button type="button" role="menuitem" onClick={onCopyVerse} disabled={d} className={itemClass}>
        <span className={iconChip}>
          <i className={`fa-solid fa-quote-left ${iconColor}`} aria-hidden />
        </span>
        <span>{t.copyVerse}</span>
      </button>
      <button type="button" role="menuitem" onClick={onCopyLink} disabled={d} className={itemClass}>
        <span className={iconChip}>
          <i className={`fa-solid fa-link ${iconColor}`} aria-hidden />
        </span>
        <span>{t.copyLink}</span>
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
          <i
            className={`fa-${isFav ? "solid" : "regular"} fa-heart ${isFav ? "text-rose-300" : iconColor}`}
            aria-hidden
          />
        </span>
        <span>{isFav ? t.unfavorite : t.favorite}</span>
      </button>
      <button type="button" role="menuitem" onClick={onShare} disabled={d} className={itemClass}>
        <span className={iconChip}>
          <i className={`fa-solid fa-share-nodes ${iconColor}`} aria-hidden />
        </span>
        <span>{t.share}</span>
      </button>
    </div>
  );
}
