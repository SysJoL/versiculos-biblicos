import { useEffect, type RefObject } from "react";
import { activateFocusTrap, type FocusTrapOptions } from "./focusTrap";

/**
 * Activa una trampa de foco mientras `isOpen` es verdadero.
 * Restaura el foco al elemento previamente enfocado al cerrarse.
 */
export function useFocusTrap(
  isOpen: boolean,
  containerRef: RefObject<HTMLElement>,
  options?: FocusTrapOptions,
) {
  const { focusContainer, trapTab, moveFocus, returnFocus } = options ?? {};

  useEffect(() => {
    if (!isOpen) return;
    const el = containerRef.current;
    if (!el) return;
    return activateFocusTrap(el, { focusContainer, trapTab, moveFocus, returnFocus });
    // returnFocus se ignora intencionalmente en las deps: es una referencia
    // puntual del momento de apertura, no un valor reactivo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, containerRef, focusContainer, trapTab, moveFocus]);
}
