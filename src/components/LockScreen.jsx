import { useState } from 'react';
import { useSecurity } from '../context/SecurityContext';

export default function LockScreen() {
  const { verifyPin } = useSecurity();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleDigit(d) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError('');
    if (next.length === 4) {
      setBusy(true);
      const ok = await verifyPin(next);
      setBusy(false);
      if (!ok) {
        setError('PIN greșit. Încearcă din nou.');
        setPin('');
      }
    }
  }

  function handleBackspace() {
    setPin((p) => p.slice(0, -1));
    setError('');
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-0)', zIndex: 1000,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 600, color: 'var(--paper)', marginBottom: 6 }}>
        Portofel blocat
      </div>
      <div style={{ fontSize: 13, color: 'rgba(244,236,219,0.5)', marginBottom: 28 }}>
        Introdu PIN-ul pentru a continua
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: '50%',
            border: '1.5px solid rgba(244,236,219,0.35)',
            background: i < pin.length ? 'var(--brass)' : 'transparent',
          }} />
        ))}
      </div>

      {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 14, minHeight: 16 }}>{error}</div>}
      {busy && <div style={{ color: 'rgba(244,236,219,0.5)', fontSize: 13, marginBottom: 14 }}>Se verifică...</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 64px)', gap: 14, marginBottom: 20 }}>
        {[1,2,3,4,5,6,7,8,9].map((n) => (
          <button key={n} onClick={() => handleDigit(String(n))} style={keypadBtnStyle}>{n}</button>
        ))}
        <div />
        <button onClick={() => handleDigit('0')} style={keypadBtnStyle}>0</button>
        <button onClick={handleBackspace} style={{ ...keypadBtnStyle, fontSize: 18 }}>⌫</button>
      </div>

    </div>
  );
}

const keypadBtnStyle = {
  width: 64, height: 64, borderRadius: '50%', border: '1px solid var(--line)',
  background: 'rgba(244,236,219,0.05)', color: 'var(--paper)', fontSize: 22, fontWeight: 600,
  cursor: 'pointer',
};
