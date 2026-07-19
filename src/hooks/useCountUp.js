import { useEffect, useRef, useState } from 'react';

/**
 * Animă o valoare numerică de la valoarea anterioară la cea nouă (ease-out cubic).
 * Reutilizabil pentru orice sumă afișată (sold, statistici, carduri spații).
 */
export default function useCountUp(targetValue, duration = 450) {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const frameRef = useRef(null);
  const fromRef = useRef(targetValue);

  useEffect(() => {
    const from = fromRef.current;
    const to = targetValue;
    if (from === to) return;

    const start = performance.now();
    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * eased;
      setDisplayValue(current);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    }
    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetValue]);

  return displayValue;
}
