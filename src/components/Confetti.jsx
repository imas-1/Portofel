import { useMemo } from 'react';

const COLORS = ['#c99a3e', '#3f8f5f', '#4f7cd6', '#b0503f', '#8b5fbf', '#e3b954'];

/**
 * Efect de confetti la atingerea unui obiectiv. Pur CSS — nicio librărie externă.
 * Se auto-elimină din DOM de către componenta părinte după ~2.5s (vezi GoalDetail).
 */
export default function Confetti({ count = 40 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.8 + Math.random() * 1.2,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
        size: 6 + Math.random() * 6,
      })),
    [count]
  );

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 500, overflow: 'hidden' }}>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '-5%',
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
            borderRadius: 2,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          to { top: 105%; transform: rotate(720deg); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
