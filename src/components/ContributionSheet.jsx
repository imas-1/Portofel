import { useState } from 'react';
import BottomSheet from './BottomSheet';
import AmountInput, { parseAmountInput } from './AmountInput';

export default function ContributionSheet({ open, onClose, onSave, currencySuffix }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const val = parseAmountInput(amount);
    if (!val || val <= 0) {
      setError('Introdu o sumă validă.');
      return;
    }
    setBusy(true);
    try {
      await onSave({ amount: val, note: note.trim() });
      setAmount('');
      setNote('');
      if (document.activeElement) document.activeElement.blur();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Adaugă bani în obiectiv">
      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>Sumă ({currencySuffix})</label>
        <AmountInput value={amount} onChange={setAmount} placeholder="ex. 200" style={inputStyle} autoFocus />
        <label style={labelStyle}>Notă (opțional)</label>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="ex. Bonus de la muncă" maxLength={60} style={inputStyle} />

        {error && <div className="error-msg">{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button type="button" onClick={onClose} style={{ ...actionBtnStyle, background: '#e8ddc4', color: 'var(--ink)' }}>Anulează</button>
          <button type="submit" disabled={busy} style={{ ...actionBtnStyle, background: 'var(--green)', color: '#fff' }}>Adaugă</button>
        </div>
      </form>
    </BottomSheet>
  );
}

const labelStyle = { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--ink-soft)', marginBottom: 6, display: 'block', fontWeight: 600 };
const inputStyle = { background: '#fffdf7', color: 'var(--ink)', border: '1.5px solid #d9cba6' };
const actionBtnStyle = { flex: 1, padding: 12, borderRadius: 10, border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14 };
