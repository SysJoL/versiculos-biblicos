type EmptyStateProps = {
  icon?: string;
  title: string;
  hint?: string;
  /** "lg" para sin-resultados, "sm" para secciones secundarias como historial. */
  size?: "lg" | "sm";
};

/**
 * Estado vacío con ilustración (papiro) para el overlay de búsqueda.
 */
export function EmptyState({ icon = "fa-scroll", title, hint, size = "lg" }: EmptyStateProps) {
  const compact = size === "sm";
  return (
    <div className={`flex flex-col items-center text-center ${compact ? "px-4 py-4" : "px-6 py-8"}`}>
      <span
        className={`flex items-center justify-center rounded-full border border-gold-500/25 bg-[radial-gradient(circle,rgba(212,175,55,0.16)_0%,transparent_65%)] ring-1 ring-inset ring-white/5 ${compact ? "h-12 w-12" : "h-24 w-24"}`}
        aria-hidden
      >
        <i
          className={`fa-solid ${icon} text-gold-300/70 [filter:drop-shadow(0_0_14px_rgba(212,175,55,0.4))] ${compact ? "text-xl" : "text-4xl"}`}
        />
      </span>
      <p className={`font-semibold text-gold-100/90 ${compact ? "mt-2 text-xs" : "mt-4 text-sm"}`}>{title}</p>
      {hint ? <p className="mt-1 text-xs text-gold-200/60">{hint}</p> : null}
    </div>
  );
}
