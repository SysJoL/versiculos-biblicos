/**
 * Focus trap para diálogos modales (bottom sheets, drawers, menús).
 *
 * Al activarse: recuerda el elemento enfocado, mueve el foco dentro del
 * contenedor y confina el `Tab`/`Shift+Tab`. Al desactivarse: quita el
 * listener y devuelve el foco al elemento original.
 */

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "audio[controls]",
  "video[controls]",
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) =>
      el.tabIndex >= 0 &&
      el.getAttribute("aria-hidden") !== "true" &&
      el.getClientRects().length > 0,
  );
}

export type FocusTrapOptions = {
  /** Mueve el foco al contenedor (recomendado en diálogos) en vez del primer elemento. */
  focusContainer?: boolean;
  /** Confina el foco con Tab. Desactívalo para menús no modales. */
  trapTab?: boolean;
  /**
   * Si es `false`, no mueve el foco al abrir (útil cuando el componente ya
   * enfoca un elemento concreto, p. ej. un input de búsqueda).
   */
  moveFocus?: boolean;
  /** Elemento al que devolver el foco al cerrar. Por defecto, el activo al abrir. */
  returnFocus?: HTMLElement | null;
};

/**
 * Activa la trampa de foco en `container`.
 * @returns función de limpieza que la desactiva y restaura el foco.
 */
export function activateFocusTrap(
  container: HTMLElement,
  options: FocusTrapOptions = {},
): () => void {
  const { focusContainer = true, trapTab = true, moveFocus = true, returnFocus } = options;
  const previouslyFocused =
    (returnFocus ?? (document.activeElement as HTMLElement | null)) || null;

  let addedTabindex = false;
  if (moveFocus) {
    if (focusContainer) {
      if (!container.hasAttribute("tabindex")) {
        container.setAttribute("tabindex", "-1");
        addedTabindex = true;
      }
      container.focus({ preventScroll: true });
    } else {
      const first = getFocusable(container)[0] ?? container;
      first.focus({ preventScroll: true });
    }
  }

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== "Tab") return;
    const focusables = getFocusable(container);
    if (focusables.length === 0) {
      event.preventDefault();
      container.focus({ preventScroll: true });
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || active === container || !container.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last || !container.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  };

  if (trapTab) document.addEventListener("keydown", onKeydown, true);

  return () => {
    if (trapTab) document.removeEventListener("keydown", onKeydown, true);
    if (addedTabindex) container.removeAttribute("tabindex");
    if (previouslyFocused && typeof previouslyFocused.focus === "function") {
      previouslyFocused.focus({ preventScroll: true });
    }
  };
}
