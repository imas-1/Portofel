import { useEffect, useState } from 'react';
import BottomSheet from './BottomSheet';
import { EMOJI_PRESETS, SPACE_COLORS } from './SpaceFormSheet';
import AmountInput, { parseAmountInput } from './AmountInput';

export default function GoalFormSheet({ open, onClose, onSave, initial }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJI_PRESETS[0]);
  const [targetAmount, setTargetAmount] = useState('');
  const [currency, setCurrency] = useState('RON');
  const [color, setColor] = useState(SPACE_COLORS[0]);
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name || '');
    setEmoji(initial?.emoji || EMOJI_PRESETS[0]);
    setTargetAmount(initial?.targetAmount ?? '');
    setCurrency(initial?.currency || 'RON');
    setColor(initial?.color || SPACE_COLORS[0]);
    setDeadline(initial?.deadline || '');
    setError('');
  }, [open, initial]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const trimmedName = name.trim().slice(0, 40);
    if (!trimmedName) {
      setError('Dă un nume obiectivului.');
      return;
    }
    const target = parseAmountInput(targetAmount);
    if (!target || target <= 0) {
      setError('Introdu o sumă țintă validă.');
      return;
    }
    setBusy(true);
    try {
      await onSave({ name: trimmedName, emoji, targetAmount: target, currency, color, deadline: deadline || null });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={initial ? 'Editează obiectivul' : 'Obiectiv nou'}>
      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>Nume</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex. Fond de urgență" maxLength={40} style={inputStyle} />

        <label style={labelStyle}>Emoji</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {EMOJI_PRESETS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => setEmoji(em)}
              style={{
                width: 42, height: 42, borderRadius: 12, fontSize: 19, cursor: 'pointer',
                border: `1.5px solid ${emoji === em ? 'var(--green)' : '#d9cba6'}`,
                background: emoji === em ? 'var(--green-soft)' : '#fffdf7',
              }}
            >
              {em}
            </button>
          ))}
        </div>

        <label style={labelStyle}>Sumă țintă</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <AmountInput value={targetAmount} onChange={setTargetAmount} placeholder="ex. 5000" style={{ ...inputStyle, flex: 1 }} />
          <div style={{ display: 'flex', gap: 4, background: '#e8ddc4', borderRadius: 10, padding: 3, height: 46 }}>
            <button type="button" onClick={() => setCurrency('RON')} style={toggleStyle(currency === 'RON')}>Lei</button>
            <button type="button" onClick={() => setCurrency('EUR')} style={toggleStyle(currency === 'EUR')}>Euro</button>
          </div>
        </div>

        <label style={labelStyle}>Termen (opțional)</label>
        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={inputStyle} />

        <label style={labelStyle}>Culoare</label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          {SPACE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{
                width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', background: c,
                border: color === c ? '3px solid var(--ink)' : '3px solid transparent',
                transform: color === c ? 'scale(1.12)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        {error && <div className="error-msg">{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button type="button" onClick={onClose} style={{ ...actionBtnStyle, background: '#e8ddc4', color: 'var(--ink)' }}>Anulează</button>
          <button type="submit" disabled={busy} style={{ ...actionBtnStyle, background: 'var(--green)', color: '#fff' }}>
            {initial ? 'Salvează' : 'Creează obiectiv'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}

function toggleStyle(active) {
  return {
    padding: '0 14px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12.5,
    background: active ? 'var(--brass)' : 'transparent', color: active ? '#2a1e08' : 'var(--ink-soft)',
  };
}

const labelStyle = { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--ink-soft)', marginBottom: 6, display: 'block', fontWeight: 600 };
const inputStyle = { background: '#fffdf7', color: 'var(--ink)', border: '1.5px solid #d9cba6' };
const actionBtnStyle = { flex: 1, padding: 12, borderRadius: 10, border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14 };
