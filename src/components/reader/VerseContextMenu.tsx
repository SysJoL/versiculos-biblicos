import { useEffect, useRef } from "react";
import type { Lang } from "@/lib/domain/types";
import type { SanctuaryTheme } from "@/lib/ui/sanctuary";
import { useVerseMenuActions } from "./useVerseMenuActions";
import { VerseActionItems } from "./VerseActionItems";

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
    isFav,
    onExport,
    onCopyImage,
    onCopyVerse,
    onCopyLink,
    onToggleFavorite,
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
  const itemBorder = isNature
    ? "border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10"
    : "border-gold-500/30 bg-gold-500/5 hover:bg-gold-500/10";
  const iconColor = isNature ? "text-emerald-300/90" : "text-gold-300/90";

  // Popover en grid 3x3: más ancho, sin scroll interno.
  const width = 400;
  const left = Math.max(8, Math.min(x, window.innerWidth - width - 8));
  const top = Math.max(8, Math.min(y, window.innerHeight - 380));

  return (
    <div
      ref={boxRef}
      role="menu"
      aria-label={t.title}
      className={`fixed z-[90] rounded-xl border p-3 shadow-[0_14px_40px_rgba(0,0,0,0.55)] backdrop-blur-md ${panelBg}`}
      style={{
        left,
        top,
        width,
        maxHeight: window.innerHeight - 16,
        overflow: "hidden",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <p className="px-1 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-200/60">
        {t.title}
      </p>
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
  );
}
