import type { Lang } from "@/lib/domain/types";
import type { SanctuaryTheme } from "@/lib/ui/sanctuary";
import { useVerseMenuActions } from "./useVerseMenuActions";

type Props = {
  lang: Lang;
  sanctuary: SanctuaryTheme;
  verseRefLabel: string;
  verseText: string;
  verseUrl: string;
  onMore: () => void;
  onClear: () => void;
};

/**
 * Barra rápida móvil: aparece al tocar un versículo.
 * Compartir (avión) · imagen · favorito · más (sheet completo).
 * Solo móvil (el padre la monta con md:hidden).
 */
export function MobileVerseQuickBar({
  lang,
  sanctuary,
  verseRefLabel,
  verseText,
  verseUrl,
  onMore,
  onClear,
}: Props) {
  const noop = () => {};
  const { busy, isFav, onExport, onToggleFavorite, onShare } = useVerseMenuActions({
    lang,
    verseRefLabel,
    verseText,
    verseUrl,
    onClose: noop,
  });

  const isNature = sanctuary === "nature";
  const accent = isNature ? "text-emerald-300" : "text-gold-300";
  const btn =
    "focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 text-gold-200 transition hover:bg-white/5 active:scale-95 disabled:opacity-50";
  const shareLabel = lang === "es" ? "Compartir versículo" : "Share verse";
  const imageLabel = lang === "es" ? "Descargar imagen" : "Download image";
  const favLabel = lang === "es" ? (isFav ? "Quitar de favoritos" : "Guardar en favoritos") : isFav ? "Remove from favorites" : "Save to favorites";
  const moreLabel = lang === "es" ? "Más opciones" : "More options";
  const clearLabel = lang === "es" ? "Quitar selección" : "Clear selection";

  return (
    <div
      className="fixed inset-x-3 bottom-3 z-40 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom,0px)" }}
      role="toolbar"
      aria-label={verseRefLabel}
    >
      <div
        className={`flex items-center gap-1 rounded-2xl border px-2 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.6)] backdrop-blur-md ${
          isNature ? "border-emerald-500/35 bg-[#081208]/95" : "border-gold-500/40 bg-[#0b1024]/95"
        }`}
      >
        <button type="button" onClick={onClear} aria-label={clearLabel} title={clearLabel} className={btn}>
          <i className="fa-solid fa-xmark text-sm" aria-hidden />
        </button>
        <span className={`min-w-0 flex-1 truncate px-1 font-display text-xs font-semibold ${accent}`}>
          {verseRefLabel}
        </span>
        <button
          type="button"
          onClick={onShare}
          disabled={busy}
          aria-label={shareLabel}
          title={shareLabel}
          className={`${btn} border-gold-500/50 bg-gold-500/15 text-gold-100 hover:bg-gold-500/25`}
        >
          <i className="fa-solid fa-paper-plane text-sm" aria-hidden />
        </button>
        <button type="button" onClick={onExport} disabled={busy} aria-label={imageLabel} title={imageLabel} className={btn}>
          {busy ? (
            <i className="fa-solid fa-spinner fa-spin text-sm" aria-hidden />
          ) : (
            <i className="fa-solid fa-download text-sm" aria-hidden />
          )}
        </button>
        <button
          type="button"
          onClick={onToggleFavorite}
          disabled={busy}
          aria-label={favLabel}
          title={favLabel}
          aria-pressed={isFav}
          className={btn}
        >
          <i className={`fa-${isFav ? "solid" : "regular"} fa-heart text-sm ${isFav ? "text-rose-300" : ""}`} aria-hidden />
        </button>
        <button type="button" onClick={onMore} aria-label={moreLabel} title={moreLabel} className={btn}>
          <i className="fa-solid fa-ellipsis text-sm" aria-hidden />
        </button>
      </div>
    </div>
  );
}
