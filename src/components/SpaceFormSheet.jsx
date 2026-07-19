import { useEffect, useState } from 'react';
import BottomSheet from './BottomSheet';

export const EMOJI_PRESETS = ['✈️','🚗','🎄','💻','🏠','🎁','💍','📱','🎓','🏖️','⚽','🐶','💰','🎂','🛠️','📚'];
export const SPACE_COLORS = ['#c99a3e', '#3f8f5f', '#4f7cd6', '#b0503f', '#8b5fbf', '#3ba7a0'];

export default function SpaceFormSheet({ open, onClose, onSave, initial }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJI_PRESETS[0]);
  const [customEmoji, setCustomEmoji] = useState('');
  const [budget, setBudget] = useState('');
  const [color, setColor] = useState(SPACE_COLORS[0]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name || '');
    setEmoji(EMOJI_PRESETS.includes(initial?.emoji) ? initial.emoji : EMOJI_PRESETS[0]);
    setCustomEmoji(initial?.emoji && !EMOJI_PRESETS.includes(initial.emoji) ? initial.emoji : '');
    setBudget(initial?.budget ?? '');
    setColor(initial?.color || SPACE_COLORS[0]);
    setDescription(initial?.description || '');
    setError('');
  }, [open, initial]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const trimmedName = name.trim().slice(0, 40);
    if (!trimmedName) {
      setError('Dă un nume spațiului.');
      return;
    }
    const budgetVal = budget ? parseFloat(budget) : null;
    if (budgetVal !== null && (isNaN(budgetVal) || budgetVal <= 0)) {
      setError('Bugetul introdus nu este valid.');
      return;
    }
    setBusy(true);
    try {
      await onSave({
        name: trimmedName,
        emoji: customEmoji.trim() || emoji,
        budget: budgetVal,
        color,
        description: description.trim().slice(0, 80),
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={initial ? 'Editează spațiul' : 'Spațiu nou'}>
      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>Nume</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex. Vacanța 2026" maxLength={40} style={inputStyle} />

        <label style={labelStyle}>Emoji</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {EMOJI_PRESETS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => { setEmoji(em); setCustomEmoji(''); }}
              style={{
                width: 42, height: 42, borderRadius: 12, fontSize: 19, cursor: 'pointer',
                border: `1.5px solid ${emoji === em && !customEmoji ? 'var(--green)' : '#d9cba6'}`,
                background: emoji === em && !customEmoji ? 'var(--green-soft)' : '#fffdf7',
              }}
            >
              {em}
            </button>
          ))}
        </div>
        <input type="text" value={customEmoji} onChange={(e) => setCustomEmoji(e.target.value)} placeholder="sau scrie propriul emoji" maxLength={4} style={inputStyle} />

        <label style={labelStyle}>Buget (opțional)</label>
        <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="ex. 2000" min="0" step="0.01" style={inputStyle} />

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

        <label style={labelStyle}>Descriere (opțional)</label>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ex. Grecia, iulie" maxLength={80} style={inputStyle} />

        {error && <div className="error-msg">{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button type="button" onClick={onClose} style={{ ...actionBtnStyle, background: '#e8ddc4', color: 'var(--ink)' }}>Anulează</button>
          <button type="submit" disabled={busy} style={{ ...actionBtnStyle, background: 'var(--green)', color: '#fff' }}>
            {initial ? 'Salvează modificările' : 'Creează spațiu'}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}

const labelStyle = { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--ink-soft)', marginBottom: 6, display: 'block', fontWeight: 600 };
const inputStyle = { background: '#fffdf7', color: 'var(--ink)', border: '1.5px solid #d9cba6' };
const actionBtnStyle = { flex: 1, padding: 12, borderRadius: 10, border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14 };
