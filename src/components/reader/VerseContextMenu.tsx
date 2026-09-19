import { useEffect, useRef } from "react";
import type { Lang } from "@/lib/domain/types";
import type { SanctuaryTheme } from "@/lib/ui/sanctuary";
import { useVerseMenuActions } from "./useVerseMenuActions";

type Props = {
  x: number;
  y: number;
  lang: Lang;
  sanctuary: SanctuaryTheme;
  /** Etiqueta visible del versículo, ej: "Juan 3:16". */
  verseRefLabel: string;
  verseText: string;
  /** URL directa al versículo (incluye ?lang=&ref=). */
  verseUrl: string;
  onClose: () => void;
};

/** Popover del versículo (PC / clic derecho). En móvil se usa VerseMenuSheet. */
export function VerseContextMenu({
  x,
  y,
  lang,
  sanctuary,
  verseRefLabel,
  verseText,
  verseUrl,
  onClose,
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const {
    t,
    busy,
    canCopyImage,
    onExport,
    onCopyImage,
    onCopyVerse,
    onCopyLink,
    onShare,
  } = useVerseMenuActions({ lang, verseRefLabel, verseText, verseUrl, onClose });

  // Cierra con clic fuera, scroll o Escape.
  useEffect(() => {
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) onClose();
    };
    const onScroll = () => onClose();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const isNature = sanctuary === "nature";
  const panelBg = isNature
    ? "border-emerald-500/30 bg-[#081208]/95"
    : "border-gold-500/35 bg-[#0f1228]/95";
  const itemHover = isNature ? "hover:bg-emerald-500/10" : "hover:bg-gold-500/10";
  const iconColor = isNature ? "text-emerald-300/90" : "text-gold-300/90";

  // Mantiene el popover dentro de la ventana.
  const width = 264;
  const left = Math.max(8, Math.min(x, window.innerWidth - width - 8));
  const top = Math.max(8, Math.min(y, window.innerHeight - 340));

  const d = busy;

  const itemClass = `flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm font-medium text-gold-100/95 transition disabled:opacity-60 ${itemHover}`;
  const iconChip =
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-inset ring-white/10";

  return (
    <div
      ref={boxRef}
      role="menu"
      aria-label={t.title}
      className={`fixed z-[90] rounded-xl border p-1.5 shadow-[0_14px_40px_rgba(0,0,0,0.55)] backdrop-blur-md ${panelBg}`}
      style={{
        left,
        top,
        width,
        maxHeight: window.innerHeight - 16,
        overflowY: "auto",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-200/60">
        {t.title}
      </p>
      <button
        type="button"
        role="menuitem"
        onClick={onExport}
        disabled={d}
        className={itemClass}
      >
        <span className={iconChip}>
          {busy ? (
            <i className="fa-solid fa-spinner fa-spin text-sm" aria-hidden />
          ) : (
            <i className={`fa-solid fa-download text-sm ${iconColor}`} aria-hidden />
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
            <i className={`fa-solid fa-file-image text-sm ${iconColor}`} aria-hidden />
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
          <i className={`fa-solid fa-quote-left text-sm ${iconColor}`} aria-hidden />
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
          <i className={`fa-solid fa-link text-sm ${iconColor}`} aria-hidden />
        </span>
        {t.copyLink}
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={onShare}
        disabled={d}
        className={itemClass}
      >
        <span className={iconChip}>
          <i className={`fa-solid fa-share-nodes text-sm ${iconColor}`} aria-hidden />
        </span>
        {t.share}
      </button>
    </div>
  );
}
