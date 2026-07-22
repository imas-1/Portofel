import { useRef, useState, memo } from 'react';

/**
 * Înfășoară orice rând cu gesturi de swipe: stânga dezvăluie ștergere,
 * dreapta (dacă e furnizat onEdit) dezvăluie editare. Tap normal trece prin.
 */
function SwipeableRow({ children, onDelete, onEdit, deleteLabel = 'Șterge ✕', editLabel = 'Editează ✎', collapsing = false }) {
  const [translateX, setTranslateX] = useState(0);
  const [open, setOpen] = useState(0); // -1 = delete deschis, 1 = edit deschis, 0 = închis
  const dragRef = useRef({ startX: 0, dragging: false });

  const maxLeft = onEdit ? 90 : 0;
  const maxRight = -90;

  function onStart(e) {
    dragRef.current.dragging = true;
    dragRef.current.startX = e.touches ? e.touches[0].clientX : e.clientX;
  }
  function onMove(e) {
    if (!dragRef.current.dragging) return;
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - dragRef.current.startX;
    const base = open === -1 ? -78 : open === 1 ? 78 : 0;
    let next = base + x;
    if (next > maxLeft) {
      next = maxLeft + (next - maxLeft) * 0.25;
    } else if (next < maxRight) {
      next = maxRight + (next - maxRight) * 0.25;
    }
    setTranslateX(next);
  }
  function onEnd() {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    if (translateX < -70) {
      setTranslateX(-78);
      setOpen(-1);
    } else if (onEdit && translateX > 70) {
      setTranslateX(78);
      setOpen(1);
    } else {
      setTranslateX(0);
      setOpen(0);
    }
  }

  return (
    <div className={`swipe-row-wrap ${collapsing ? 'row-collapsing' : ''}`}>
      <div className="swipe-row-bg" onClick={onDelete}>{deleteLabel}</div>
      {onEdit && (
        <div className="swipe-row-bg swipe-row-bg-left" onClick={onEdit}>{editLabel}</div>
      )}
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

export default memo(SwipeableRow);
