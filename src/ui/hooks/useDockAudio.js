// ========================================================
// FUPAIS — useDockAudio (Sprint 2)
// Sonidos de interfaz estilo Apple vía Web Audio API, réplica
// exacta de FuPaisDock.playClickSound. El AudioContext vive en un
// ref singleton (nunca provoca render) y se reanuda si el navegador
// lo suspendió. Gated por soundEnabled vía ref "latest".
// ========================================================

import { useCallback, useRef } from "react";

export function useDockAudio(enabled = true) {
  const ctxRef = useRef(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const play = useCallback((freq = 800, type = "sine", duration = 0.04) => {
    if (!enabledRef.current) return;
    try {
      if (!ctxRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return; // jsdom / entornos sin Web Audio
        ctxRef.current = new AudioCtx();
      }
      if (ctxRef.current.state === "suspended") {
        ctxRef.current.resume();
      }
      const osc = ctxRef.current.createOscillator();
      const gain = ctxRef.current.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctxRef.current.currentTime);
      gain.gain.setValueAtTime(0.04, ctxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctxRef.current.currentTime + duration
      );
      osc.connect(gain);
      gain.connect(ctxRef.current.destination);
      osc.start();
      osc.stop(ctxRef.current.currentTime + duration);
    } catch {
      // Política de autoplay o audio no disponible
    }
  }, []);

  return play;
}

export default useDockAudio;
