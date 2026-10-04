import { Component, type ReactNode } from "react";
import type { Lang } from "@/lib/domain/types";

type ErrorBoundaryProps = {
  lang?: Lang;
  code?: string;
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  resetKey: number;
};

const COPY = {
  es: {
    title: "Algo se rompió aquí.",
    hint: "No te preocupes, tu lugar está a salvo. Prueba de nuevo.",
    retry: "Reintentar",
    home: "Ir al inicio",
  },
  en: {
    title: "Something broke here.",
    hint: "Don't worry, your place is safe. Try again.",
    retry: "Retry",
    home: "Go home",
  },
} as const;

/**
 * Atrapa errores de render en las islas de React (versículo, lector) y
 * muestra una tarjeta con código en vez de dejar la página en blanco.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, resetKey: 0 };

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    try {
      console.error("[refugio] island crash:", error);
    } catch {
      /* consola no disponible */
    }
  }

  private handleRetry = () => {
    this.setState((prev) => ({ hasError: false, resetKey: prev.resetKey + 1 }));
  };

  render() {
    const { lang = "es", code = "500", children } = this.props;
    const { hasError, resetKey } = this.state;
    const t = COPY[lang];

    if (!hasError) {
      return <div key={resetKey}>{children}</div>;
    }

    return (
      <section
        role="alert"
        className="mx-auto w-full max-w-xl rounded-2xl border border-gold-500/25 bg-[#0e132d]/70 p-6 text-center shadow-[0_0_22px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-8"
      >
        <img
          src="/img/logo-refugio-celestial-best.png"
          alt=""
          aria-hidden="true"
          className="mx-auto mb-4 h-16 w-16 rounded-full border border-gold-500/30 object-cover"
          loading="lazy"
        />
        <p className="font-display text-3xl font-bold tracking-[0.12em] text-gold-200 sm:text-4xl">
          {code}
        </p>
        <p className="mt-3 text-base text-gold-100/90 sm:text-lg">{t.title}</p>
        <p className="mt-2 text-sm text-gold-300/70">{t.hint}</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-gold-500/40 bg-gold-500/10 px-6 py-2 text-sm font-semibold text-gold-100 transition hover:border-gold-400 hover:bg-gold-500/20"
          >
            <i className="fa-solid fa-rotate mr-2 text-xs" aria-hidden />
            {t.retry}
          </button>
          <a
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-gold-500/25 bg-black/25 px-6 py-2 text-sm font-semibold text-gold-100/90 transition hover:border-gold-500/40 hover:bg-black/35"
          >
            {t.home}
          </a>
        </div>
      </section>
    );
  }
}
