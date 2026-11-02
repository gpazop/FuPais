// ========================================================
// FUPAIS — useAutoHide (Sprint 2)
// Ocultado automático del dock tras 1200ms sin hover (mismo
// temporizador que FuPaisDock.bindDockEvents), con cancelación al
// re-entrar y limpieza garantizada en unmount.
// ========================================================

import { useCallback, useEffect, useRef } from "react";

const AUTO_HIDE_DELAY_MS = 1200;

export function useAutoHide({ enabled, onHide }) {
  const timerRef = useRef(null);
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  const cancelHide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    if (!enabled) return;
    cancelHide();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onHideRef.current?.();
    }, AUTO_HIDE_DELAY_MS);
  }, [enabled, cancelHide]);

  useEffect(() => () => cancelHide(), [cancelHide]);

  return { scheduleHide, cancelHide };
}

export default useAutoHide;
