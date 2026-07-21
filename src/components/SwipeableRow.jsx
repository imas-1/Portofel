import { useRef, useState } from 'react';

/**
 * Înfășoară orice rând cu gest de swipe spre stânga pentru a dezvălui butonul de ștergere.
 * Tap normal (fără swipe) trece prin, click pe fundalul roșu declanșează onDelete.
 */
export default function SwipeableRow({ children, onDelete, deleteLabel = 'Șterge ✕' }) {
  const [translateX, setTranslateX] = useState(0);
  const [open, setOpen] = useState(false);
  const dragRef = useRef({ startX: 0, dragging: false });

  function onStart(e) {
    dragRef.current.dragging = true;
    dragRef.current.startX = e.touches ? e.touches[0].clientX : e.clientX;
  }
  function onMove(e) {
    if (!dragRef.current.dragging) return;
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - dragRef.current.startX;
    let next = open ? x - 78 : x;
    next = Math.min(0, Math.max(-90, next));
    setTranslateX(next);
  }
  function onEnd() {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    if (translateX < -70) {
      setTranslateX(-78);
      setOpen(true);
    } else {
      setTranslateX(0);
      setOpen(false);
    }
  }

  return (
    <div className="swipe-row-wrap">
      <div className="swipe-row-bg" onClick={onDelete}>{deleteLabel}</div>
      <div
        className="swipe-row-fg"
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
        onMouseDown={onStart}
        onMouseMove={onMove}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
      >
        {children}
      </div>
    </div>
  );
}
