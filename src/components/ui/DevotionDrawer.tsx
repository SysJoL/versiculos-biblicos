import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

export type DevotionAction = "meditate" | "pray" | "reflect";

type DevotionDrawerProps = {
  isOpen: boolean;
  action: DevotionAction;
  icon: string;
  title: string;
  lead: string;
  verseRef: string;
  verseText: string;
  steps: string[];
  closing: string;
  onClose: () => void;
  footer?: ReactNode;
  closeLabel?: string;
  zIndexClassName?: string;
  sanctuary?: "celestial" | "nature";
};

/**
 * Lateral derecho para Medita / Ora / Reflexiona:
 * - Móvil y desktop: panel derecho (casi full-width en móvil).
 * - Cierra con Esc, clic en overlay o botón.
 */
export function DevotionDrawer({
  isOpen,
  action,
  icon,
  title,
  lead,
  verseRef,
  verseText,
  steps,
  closing,
  onClose,
  footer,
  closeLabel = "Cerrar",
  zIndexClassName = "z-[95]",
  sanctuary = "celestial",
}: DevotionDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  const isNature = sanctuary === "nature";
  const panelBg = isNature ? "bg-[#081208]" : "bg-[#0b1024]";
  const panelBorder = isNature ? "border-emerald-400/50" : "border-gold-400/55";
  const titleColor = isNature ? "text-emerald-100" : "text-gold-200";
  const accentBorder = isNature ? "border-emerald-500/30" : "border-gold-500/35";
  const accentBg = isNature ? "bg-emerald-500/10" : "bg-gold-500/10";
  const accentText = isNature ? "text-emerald-200" : "text-gold-300";
  const quoteBorder = isNature ? "border-emerald-400/45" : "border-gold-400/45";
  const quoteText = isNature ? "text-emerald-50" : "text-[#f4c95d]";
  const stepNum = isNature ? "border-emerald-400/50 text-emerald-200" : "border-gold-400/50 text-gold-300";
  const closeBtnBorder = isNature
    ? "border-emerald-500/40 hover:border-emerald-300 hover:bg-emerald-500/15"
    : "border-gold-500/45 hover:border-gold-300 hover:bg-gold-500/15";

  return createPortal(
    <div
      className={`fixed inset-0 ${zIndexClassName} bg-[#04060f]/70 backdrop-blur-[2px]`}
      onClick={onClose}
    >
      <style>{`@keyframes devotion-drawer-in{from{transform:translateX(100%)}to{transform:translateX(0)}}
@media (prefers-reduced-motion: reduce){.devotion-drawer-panel{animation:none !important}}`}</style>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-devotion-action={action}
        onClick={(e) => e.stopPropagation()}
        className={`devotion-drawer-panel absolute right-0 top-0 flex h-dvh w-[min(92vw,24rem)] min-h-0 flex-col border-l text-gold-100 shadow-[-24px_0_64px_rgba(0,0,0,0.6)] ${panelBg} ${panelBorder}`}
        style={{ animation: "devotion-drawer-in 0.32s cubic-bezier(0.32, 0.72, 0, 1)" }}
      >
        <header className={`flex items-center gap-3 border-b px-4 pb-3 pt-4 ${accentBorder}`}>
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${accentBorder} ${accentBg} ${accentText}`}
            aria-hidden
          >
            <i className={`fa-solid ${icon}`} />
          </span>
          <h3 className={`min-w-0 flex-1 font-display text-sm font-semibold uppercase tracking-[0.12em] ${titleColor}`}>
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-gold-100 transition ${closeBtnBorder}`}
          >
            <i className="fa-solid fa-xmark" aria-hidden />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          <blockquote className={`rounded-xl border bg-black/25 p-4 ${quoteBorder}`}>
            <p className={`text-sm font-medium italic leading-relaxed ${quoteText}`}>
              “{verseText}”
            </p>
            <cite className={`mt-2 block text-right font-display text-xs tracking-[0.14em] ${accentText} not-italic`}>
              {verseRef}
            </cite>
          </blockquote>

          <p className="text-sm leading-relaxed text-gold-100/90">{lead}</p>

          <ol className="flex flex-col gap-2.5">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-display text-[11px] font-bold ${stepNum}`}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span className="text-[13px] leading-relaxed text-gold-100/85">{step}</span>
              </li>
            ))}
          </ol>

          <p className={`border-t pt-3 text-center font-body text-[15px] italic leading-relaxed text-gold-200/80 ${accentBorder}`}>
            {closing}
          </p>
        </div>

        <footer className={`border-t px-4 py-3 ${accentBorder}`}>
          {footer ?? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-gold-400/65 bg-gold-500/15 px-4 text-xs font-semibold text-gold-100 transition hover:border-gold-300 hover:bg-gold-500/25"
            >
              {closeLabel}
            </button>
          )}
        </footer>
      </aside>
    </div>,
    document.body
  );
}
