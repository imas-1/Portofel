/**
 * Vibrație scurtă la acțiuni cheie. Doar pe dispozitivele care suportă navigator.vibrate
 * (Android — Chrome/Firefox). iOS Safari nu suportă API-ul, funcția nu face nimic acolo.
 */
export default function useHaptic() {
  return function haptic(ms = 10) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (e) { /* ignorăm */ }
    }
  };
}
