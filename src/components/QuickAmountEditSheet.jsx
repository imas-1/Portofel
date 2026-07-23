import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AmountInput, { parseAmountInput } from './AmountInput';

/**
 * Pop-up mic (nu bottom-sheet) pentru editarea rapidă a sumei unei tranzacții,
 * declanșat la tap direct pe rând. Separat de editarea completă (swipe dreapta),
 * care rămâne disponibilă pentru schimbarea categoriei/metodei/descrierii.
 */
export default function QuickAmountEditSheet({ open, onClose, initialAmount, onSave }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(initialAmount != null ? String(initialAmount) : '');
      setError('');
    }
  }, [open, initialAmount]);

  if (!open) return null;
  const root = document.getElementById('app-overlay-root');
  if (!root) return null;

  async function handleSave() {
    const val = parseAmountInput(amount);
    if (!val || val <= 0) {
      setError('Sumă invalidă.');
      return;
    }
    setBusy(true);
    try {
      await onSave(val);
      onClose();
    } catch (err) {
      setError(err.message || 'A apărut o eroare.');
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 320, background: 'var(--paper)', color: 'var(--ink)',
          borderRadius: 18, padding: '22px 20px', animation: 'popIn 0.2s ease both',
        }}
      >
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 600, marginBottom: 14 }}>
          Editează suma
        </div>
        <AmountInput value={amount} onChange={setAmount} placeholder="Sumă" />
        {error && <div className="error-msg" style={{ marginTop: 8 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid rgba(27,51,40,0.2)', background: 'none', color: 'var(--ink)', fontWeight: 600, cursor: 'pointer' }}
          >
            Anulează
          </button>
          <button type="button" onClick={handleSave} disabled={busy} className="btn-primary" style={{ flex: 1 }}>
            {busy ? <span className="spinner" /> : 'Salvează'}
          </button>
        </div>
      </div>
    </div>,
    root
  );
}
