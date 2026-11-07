import { useEffect, useId, useRef, useState } from "react";
import type { Lang, Mood } from "@/lib/domain/types";
import { UI } from "@/lib/i18n/labels";
import { MOOD_OPTIONS } from "@/lib/ui/moodOptions";

type Props = {
  lang: Lang;
  mood: Mood;
  onChange: (mood: Mood) => void;
  disabled?: boolean;
};

/**
 * Chip de categoría convertido en selector. En móvil/tablet abre un listbox
 * con las seis categorías; el cambio se aplica sin recargar la página.
 */
export function MoodChipMenu({ lang, mood, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listId = useId();
  const label = lang === "es" ? "Categoría" : "Category";
  const L = UI[lang].mood;
  const current = MOOD_OPTIONS.find((o) => o.id === mood) ?? MOOD_OPTIONS[0]!;

  const selectedIdx = Math.max(
    0,
    MOOD_OPTIONS.findIndex((o) => o.id === mood),
  );

  const focusOption = (idx: number) => {
    const next = (idx + MOOD_OPTIONS.length) % MOOD_OPTIONS.length;
    setActiveIdx(next);
    optionRefs.current[next]?.focus({ preventScroll: true });
  };

  const closeMenu = (focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) buttonRef.current?.focus({ preventScroll: true });
  };

  const openMenu = () => {
    if (disabled) return;
    setOpen(true);
    setActiveIdx(selectedIdx);
    requestAnimationFrame(() => {
      optionRefs.current[selectedIdx]?.focus({ preventScroll: true });
    });
  };

  const choose = (next: Mood) => {
    closeMenu();
    if (next !== mood) onChange(next);
  };

  // Cerrar al tocar fuera del chip.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) closeMenu(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Cerrar con Escape desde cualquier punto mientras está abierto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const onOptionKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusOption(idx + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusOption(idx - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusOption(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusOption(MOOD_OPTIONS.length - 1);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative flex min-w-0 justify-center">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${L[mood]}`}
        disabled={disabled}
        onClick={() => (open ? closeMenu(false) : openMenu())}
        className="focus-ring inline-flex min-w-0 max-w-full items-center justify-center gap-1.5 rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-center font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-400 transition hover:border-gold-500/60 hover:bg-gold-500/15 disabled:cursor-wait disabled:opacity-60"
      >
        <i
          className={`fa-solid ${current.icon} shrink-0 text-[0.9em] opacity-80`}
          aria-hidden
        />
        <span className="truncate">{L[mood]}</span>
        <i
          className={`fa-solid fa-chevron-down shrink-0 text-[0.7em] opacity-70 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      <div
        id={listId}
        role="listbox"
        aria-label={label}
        aria-hidden={!open}
        className={`absolute left-1/2 top-full z-50 mt-2 w-56 max-w-[calc(100vw-2rem)] origin-top -translate-x-1/2 overflow-hidden rounded-xl border border-gold-500/30 bg-[rgb(var(--refugio-surface-2)/0.97)] shadow-[0_18px_50px_rgba(0,0,0,0.6)] ring-1 ring-inset ring-white/5 backdrop-blur-md transition-all duration-200 ${
          open
            ? "visible scale-100 opacity-100"
            : "invisible scale-[0.98] opacity-0"
        }`}
      >
        {MOOD_OPTIONS.map((opt, i) => {
          const isActive = opt.id === mood;
          return (
            <button
              key={opt.id}
              ref={(el) => {
                optionRefs.current[i] = el;
              }}
              type="button"
              role="option"
              aria-selected={isActive}
              tabIndex={-1}
              onClick={() => choose(opt.id)}
              onKeyDown={(e) => onOptionKeyDown(e, i)}
              onMouseEnter={() => setActiveIdx(i)}
              className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition active:scale-[0.99] ${
                isActive
                  ? "bg-gradient-to-r from-gold-500/25 via-gold-500/12 to-transparent font-semibold text-gold-100"
                  : i === activeIdx
                    ? "bg-white/[0.06] font-medium text-gold-100"
                    : "font-medium text-gold-100/80 hover:bg-white/[0.05] hover:text-gold-100"
              }`}
            >
              <i
                className={`fa-solid ${opt.icon} w-4 shrink-0 text-center text-[0.8rem] text-gold-300/85`}
                aria-hidden
              />
              <span className="flex-1 truncate">{L[opt.id]}</span>
              {isActive && (
                <i
                  className="fa-solid fa-check shrink-0 text-xs text-gold-300"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
