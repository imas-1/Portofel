import { useRef, useState } from 'react';

/**
 * Detectează gestul de tragere în jos, din vârful paginii, și afișează un indicator
 * scurt. Firebase Realtime Database e mereu live, deci "refresh"-ul e în principal
 * o confirmare vizuală + o reconectare defensivă, nu o re-descărcare completă.
 */
export default function usePullToRefresh(onRefresh) {
  const [active, setActive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  function onTouchStart(e) {
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }
  function onTouchMove(e) {
    if (!pulling.current) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 60) setActive(true);
  }
  async function onTouchEnd() {
    if (!pulling.current) return;
    pulling.current = false;
    if (active) {
      setRefreshing(true);
      try {
        if (onRefresh) await onRefresh();
        else await new Promise((r) => setTimeout(r, 500));
      } finally {
        setTimeout(() => {
          setActive(false);
          setRefreshing(false);
        }, 400);
      }
    }
  }

  return {
    active,
    refreshing,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
