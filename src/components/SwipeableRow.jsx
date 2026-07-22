import { useRef, useState, useEffect, memo } from 'react';

/**
 * Înfășoară orice rând cu gesturi de swipe: stânga dezvăluie ștergere,
 * dreapta (dacă e furnizat onEdit) dezvăluie editare. Tap normal trece prin.
 *
 * Notă tehnică: ascultătorii de touch sunt atașați manual (addEventListener),
 * NU prin prop-urile React onTouchStart/onTouchMove — React atașează
 * touchmove ca listener "passive" implicit, ceea ce face ca preventDefault()
 * să nu aibă niciun efect acolo (gestul rămâne "blocat"/glitch-uiește vizual,
 * fără nicio eroare vizibilă). În plus, gestul are un "direction lock":
 * primele ~8px de mișcare decid dacă e swipe orizontal (ștergere/editare)
 * sau scroll vertical normal al listei — fără asta, orice atingere pe rând
 * intră în conflict cu scroll-ul paginii și blochează ambele gesturi.
 */
function SwipeableRow({ children, onDelete, onEdit, deleteLabel = 'Șterge ✕', editLabel = 'Editează ✎', collapsing = false }) {
  const [translateX, setTranslateX] = useState(0);
  const fgRef = useRef(null);
  const posRef = useRef(0); // oglindește translateX, citit sincron în timpul gestului
  const drag = useRef({ active: false, startX: 0, startY: 0, base: 0, locked: null, lastTouchTime: 0 });

  const maxLeft = onEdit ? 90 : 0;
  const maxRight = -90;

  function setPos(next) {
    posRef.current = next;
    setTranslateX(next);
  }

  useEffect(() => {
    const el = fgRef.current;
    if (!el) return;

    function clamp(next) {
      if (next > maxLeft) return maxLeft + (next - maxLeft) * 0.25;
      if (next < maxRight) return maxRight + (next - maxRight) * 0.25;
      return next;
    }

    function start(x, y) {
      drag.current.active = true;
      drag.current.startX = x;
      drag.current.startY = y;
      drag.current.base = posRef.current;
      drag.current.locked = null;
    }

    function lockHorizontal() {
      el.style.transition = 'none'; // urmărește degetul fără întârziere din CSS transition
    }

    function move(x, y, evt) {
      const d = drag.current;
      if (!d.active) return;
      const dx = x - d.startX;
      const dy = y - d.startY;

      if (d.locked === null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; // prea puțină mișcare, așteaptă
        d.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (d.locked === 'y') { d.active = false; return; } // e scroll vertical, cedăm gestul listei
        lockHorizontal();
      }
      if (d.locked !== 'x') return;

      if (evt.cancelable) evt.preventDefault(); // blocăm scroll-ul nativ cât timp tragem orizontal
      setPos(clamp(d.base + dx));
    }

    function end() {
      const d = drag.current;
      if (!d.active || d.locked !== 'x') { d.active = false; return; }
      d.active = false;
      el.style.transition = ''; // revenim la tranziția CSS pt. animația de "snap"
      const current = posRef.current;
      if (current < -70) setPos(-78);
      else if (onEdit && current > 70) setPos(78);
      else setPos(0);
    }

    function onTouchStart(e) {
      drag.current.lastTouchTime = Date.now();
      const t = e.touches[0];
      start(t.clientX, t.clientY);
    }
    function onTouchMove(e) {
      const t = e.touches[0];
      move(t.clientX, t.clientY, e);
    }
    function onTouchEnd() { end(); }

    function onMouseDown(e) {
      // ignoră evenimentele mouse sintetizate imediat după un touch (ghost events)
      if (Date.now() - drag.current.lastTouchTime < 500) return;
      start(e.clientX, e.clientY);
      const onMouseMove = (ev) => move(ev.clientX, ev.clientY, ev);
      const onMouseUp = () => { end(); window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    el.addEventListener('mousedown', onMouseDown);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('mousedown', onMouseDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onEdit]);

  return (
    <div className={`swipe-row-wrap ${collapsing ? 'row-collapsing' : ''}`}>
      <div className="swipe-row-bg" onClick={onDelete}>{deleteLabel}</div>
      {onEdit && (
        <div className="swipe-row-bg swipe-row-bg-left" onClick={onEdit}>{editLabel}</div>
      )}
      <div ref={fgRef} className="swipe-row-fg" style={{ transform: `translateX(${translateX}px)` }}>
        {children}
      </div>
    </div>
  );
}

export default memo(SwipeableRow);
