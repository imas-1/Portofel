import { useEffect, useState } from 'react';
import BottomSheet from './BottomSheet';
import { CATEGORIES } from '../context/DataContext';

export default function SpaceEntrySheet({ open, onClose, onSave, initial }) {
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('altele');
  const [method, setMethod] = useState('card');
  const [currency, setCurrency] = useState('RON');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(initial?.type || 'expense');
    setCategory(initial?.category || 'altele');
    setMethod(initial?.method || 'card');
    setCurrency(initial?.currency || 'RON');
    setAmount(initial?.amount ?? '');
    setDesc(initial?.desc || '');
    setDate(
      initial?.createdAt
        ? new Date(initial.createdAt).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10)
    );
    setError('');
  }, [open, initial]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setError('Introdu o sumă validă.');
      return;
    }
    let createdAt = Date.now();
    if (date) {
      const chosen = new Date(date + 'T12:00:00');
      if (!isNaN(chosen.getTime())) createdAt = chosen.getTime();
    }
    setBusy(true);
    try {
      await onSave({ type, category, method, currency, amount: val, desc: desc.trim(), createdAt });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={initial ? 'Editează tranzacția' : 'Tranzacție nouă'}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, background: '#e8ddc4', borderRadius: 10, padding: 3 }}>
          <button type="button" onClick={() => setType('income')} style={toggleStyle(type === 'income', 'var(--green)')}>+ Am primit</button>
          <button type="button" onClick={() => setType('expense')} style={toggleStyle(type === 'expense', 'var(--red)')}>− Am cheltuit</button>
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setCategory(c.id)}
              style={{
                flexShrink: 0, padding: '8px 13px', borderRadius: 20, whiteSpace: 'nowrap', cursor: 'pointer',
                border: '1px solid #d9cba6',
                background: category === c.id ? 'var(--brass)' : '#fffdf7',
                color: category === c.id ? '#2a1e08' : 'var(--ink-soft)',
                fontWeight: category === c.id ? 600 : 400,
              }}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <div style={{ flex: 1, display: 'flex', gap: 4, background: '#e8ddc4', borderRadius: 10, padding: 3 }}>
            <button type="button" onClick={() => setMethod('card')} style={toggleStyle(method === 'card', 'var(--brass)', true)}>💳 Card</button>
            <button type="button" onClick={() => setMethod('cash')} style={toggleStyle(method === 'cash', 'var(--brass)', true)}>💵 Cash</button>
          </div>
          <div style={{ flex: 1, display: 'flex', gap: 4, background: '#e8ddc4', borderRadius: 10, padding: 3 }}>
            <button type="button" onClick={() => setCurrency('RON')} style={toggleStyle(currency === 'RON', 'var(--brass)', true)}>Lei</button>
            <button type="button" onClick={() => setCurrency('EUR')} style={toggleStyle(currency === 'EUR', 'var(--brass)', true)}>Euro</button>
          </div>
        </div>

        <label style={labelStyle}>Sumă</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Sumă" min="0" step="0.01" style={inputStyle} />
        <label style={labelStyle}>Descriere</label>
        <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descriere (opțional)" maxLength={80} style={inputStyle} />
        <label style={labelStyle}>Data</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />

        {error && <div className="error-msg">{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button type="button" onClick={onClose} style={{ ...actionBtnStyle, background: '#e8ddc4', color: 'var(--ink)' }}>Anulează</button>
          <button type="submit" disabled={busy} style={{ ...actionBtnStyle, background: 'var(--green)', color: '#fff' }}>Salvează</button>
        </div>
      </form>
    </BottomSheet>
  );
}

function toggleStyle(active, activeColor, small) {
  return {
    flex: 1, padding: small ? '8px 6px' : '11px', border: 'none', borderRadius: 8, cursor: 'pointer',
    fontWeight: 600, fontSize: small ? 12.5 : 14,
    background: active ? activeColor : 'transparent',
    color: active ? (activeColor === 'var(--brass)' ? '#2a1e08' : '#fff') : 'var(--ink-soft)',
  };
}

const labelStyle = { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--ink-soft)', marginBottom: 6, display: 'block', fontWeight: 600 };
const inputStyle = { background: '#fffdf7', color: 'var(--ink)', border: '1.5px solid #d9cba6' };
const actionBtnStyle = { flex: 1, padding: 12, borderRadius: 10, border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14 };
