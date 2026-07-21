import { useState } from 'react';
import BottomSheet from './BottomSheet';
import { useSecurity } from '../context/SecurityContext';

export default function SetPinSheet({ open, onClose }) {
  const { setPin } = useSecurity();
  const [step, setStep] = useState('enter'); // 'enter' | 'confirm'
  const [firstPin, setFirstPin] = useState('');
  const [pin, setLocalPin] = useState('');
  const [error, setError] = useState('');

  function reset() {
    setStep('enter');
    setFirstPin('');
    setLocalPin('');
    setError('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleDigit(d) {
    if (pin.length >= 6) return;
    const next = pin + d;
    setLocalPin(next);
    setError('');

    if (next.length === 4 || next.length === 6) {
      if (step === 'enter') {
        setFirstPin(next);
        setLocalPin('');
        setStep('confirm');
      } else {
        if (next === firstPin) {
          await setPin(next);
          handleClose();
        } else {
          setError('PIN-urile nu coincid. Încearcă din nou.');
          setLocalPin('');
          setFirstPin('');
          setStep('enter');
        }
      }
    }
  }

  function handleBackspace() {
    setLocalPin((p) => p.slice(0, -1));
  }

  return (
    <BottomSheet open={open} onClose={handleClose} title={step === 'enter' ? 'Setează un PIN nou' : 'Confirmă PIN-ul'}>
      <div style={{ textAlign: 'center', paddingBottom: 10 }}>
        <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 18 }}>
          {step === 'enter' ? 'Alege 4 sau 6 cifre' : 'Introdu din nou aceleași cifre'}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 18 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{
              width: 12, height: 12, borderRadius: '50%',
              border: '1.5px solid #c9b98b',
              background: i < pin.length ? 'var(--brass)' : 'transparent',
            }} />
          ))}
        </div>

        {error && <div className="error-msg">{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 58px)', gap: 12, justifyContent: 'center', marginBottom: 6 }}>
          {[1,2,3,4,5,6,7,8,9].map((n) => (
            <button key={n} type="button" onClick={() => handleDigit(String(n))} style={keypadBtnStyle}>{n}</button>
          ))}
          <div />
          <button type="button" onClick={() => handleDigit('0')} style={keypadBtnStyle}>0</button>
          <button type="button" onClick={handleBackspace} style={{ ...keypadBtnStyle, fontSize: 16 }}>⌫</button>
        </div>
      </div>

      <button type="button" onClick={handleClose} style={{
        width: '100%', padding: 12, borderRadius: 10, border: 'none', fontWeight: 700, cursor: 'pointer',
        fontSize: 14, background: '#e8ddc4', color: 'var(--ink)',
      }}>
        Anulează
      </button>
    </BottomSheet>
  );
}

const keypadBtnStyle = {
  width: 58, height: 58, borderRadius: '50%', border: '1.5px solid #d9cba6',
  background: '#fffdf7', color: 'var(--ink)', fontSize: 19, fontWeight: 600, cursor: 'pointer',
};
