import { useMemo, useState } from 'react';
import { useData, CATEGORIES, CAT_MAP, curSuffix } from '../context/DataContext';
import useCountUp from '../hooks/useCountUp';
import AmountInput, { parseAmountInput } from '../components/AmountInput';

function fmt(n) {
  return n.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function monthKey(ts) {
  const d = new Date(ts);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function currentMonthKey() {
  return monthKey(Date.now());
}

function previousMonthKey() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return monthKey(d.getTime());
}

export default function Dashboard() {
  const { entries, addEntry, deleteEntry } = useData();
  const [currency, setCurrency] = useState('RON');
  const [type, setType] = useState('income');
  const [category, setCategory] = useState('salariu');
  const [method, setMethod] = useState('card');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const curEntries = useMemo(
    () => entries.filter((e) => (e.currency || 'RON') === currency && !e.isTransfer),
    [entries, currency]
  );

  const income = curEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const expense = curEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const balance = income - expense;
  const animatedBalance = useCountUp(balance);

  // Economii luna aceasta + comparație cu luna trecută
  const thisMonthKey = currentMonthKey();
  const prevMonthKey = previousMonthKey();
  const thisMonthEntries = curEntries.filter((e) => monthKey(e.createdAt) === thisMonthKey);
  const prevMonthEntries = curEntries.filter((e) => monthKey(e.createdAt) === prevMonthKey);

  const thisMonthSavings =
    thisMonthEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0) -
    thisMonthEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const prevMonthSavings =
    prevMonthEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0) -
    prevMonthEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const savingsDelta = thisMonthSavings - prevMonthSavings;

  // Ultima tranzacție
  const lastTransaction = [...curEntries].sort((a, b) => b.createdAt - a.createdAt)[0];

  // Rezumatul lunii: nr. tranzacții, medie zilnică cheltuită, categoria principală
  const daysSoFar = new Date().getDate();
  const thisMonthExpense = thisMonthEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const dailyAvg = daysSoFar > 0 ? thisMonthExpense / daysSoFar : 0;
  const categoryTotals = {};
  thisMonthEntries.filter((e) => e.type === 'expense').forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });
  const topCategoryId = Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a])[0];
  const topCategory = topCategoryId ? CAT_MAP[topCategoryId] : null;

  const sorted = [...curEntries].sort((a, b) => b.createdAt - a.createdAt).slice(0, 30);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    const val = parseAmountInput(amount);
    if (!val || val <= 0) {
      setError('Introdu o sumă validă.');
      return;
    }
    setBusy(true);
    try {
      await addEntry({ type, amount: val, category, method, currency, desc });
      setAmount('');
      setDesc('');
      if (document.activeElement) document.activeElement.blur(); // închide tastatura
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Ștergi această tranzacție?')) return;
    await deleteEntry(id);
  }

  return (
    <div className="app-shell">
      <div className="brand-row">
        <div>
          <div className="brand">Portofel</div>
          <div className="brand-tag">Registru personal</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {['RON', 'EUR'].map((c) => (
          <button
            key={c}
            onClick={() => setCurrency(c)}
            style={{
              padding: '6px 16px', borderRadius: 20, cursor: 'pointer', fontWeight: 700, fontSize: 12.5,
              border: '1.5px solid rgba(244,236,219,0.25)', transition: 'background .15s, color .15s',
              background: currency === c ? 'var(--brass)' : 'transparent',
              color: currency === c ? '#2a1e08' : 'rgba(244,236,219,0.6)',
            }}
          >
            {c === 'RON' ? 'Lei' : 'Euro'}
          </button>
        ))}
      </div>

      <div className="ledger stagger-card">
        <div className="ledger-top">
          <div className="ledger-label">Sold actual</div>
          <div className="ledger-value" style={{ color: animatedBalance < 0 ? 'var(--red)' : 'var(--ink)' }}>
            {fmt(animatedBalance)} {curSuffix(currency)}
          </div>
        </div>
        <div className="ledger-stub">
          <div className="stub-cell income">
            <div className="stub-label">Primit</div>
            <div className="stub-value">{fmt(income)}</div>
          </div>
          <div className="stub-cell expense">
            <div className="stub-label">Cheltuit</div>
            <div className="stub-value">{fmt(expense)}</div>
          </div>
        </div>
      </div>

      {/* Carduri Premium: economii, ultima tranzacție */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div className="mini-stat-card stagger-card" style={{ animationDelay: '0.05s' }}>
          <div className="mini-stat-label">💰 Economii luna asta</div>
          <div className="mini-stat-value" style={{ color: thisMonthSavings < 0 ? 'var(--red)' : 'var(--green)' }}>
            {fmt(thisMonthSavings)} {curSuffix(currency)}
          </div>
          {prevMonthEntries.length > 0 && (
            <div className={`mini-stat-sub ${savingsDelta >= 0 ? 'mini-stat-delta-up' : 'mini-stat-delta-down'}`}>
              {savingsDelta >= 0 ? '▲' : '▼'} {fmt(Math.abs(savingsDelta))} față de luna trecută
            </div>
          )}
        </div>

        <div className="mini-stat-card stagger-card" style={{ animationDelay: '0.1s' }}>
          <div className="mini-stat-label">🕐 Ultima tranzacție</div>
          {lastTransaction ? (
            <>
              <div className="mini-stat-value" style={{ color: lastTransaction.type === 'income' ? '#6fd196' : '#e08672', fontSize: 15 }}>
                {lastTransaction.type === 'income' ? '+' : '−'}{fmt(lastTransaction.amount)} {curSuffix(currency)}
              </div>
              <div className="mini-stat-sub" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {lastTransaction.desc}
              </div>
            </>
          ) : (
            <div className="mini-stat-sub">Nicio tranzacție</div>
          )}
        </div>
      </div>

      {/* Rezumatul lunii */}
      <div className="card stagger-card" style={{ animationDelay: '0.15s' }}>
        <div style={{ fontSize: 11, color: 'rgba(244,236,219,0.45)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, marginBottom: 12 }}>
          📅 Rezumatul lunii
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <SummaryItem label="Tranzacții" value={thisMonthEntries.length} />
          <SummaryItem label="Medie/zi" value={`${fmt(dailyAvg)} ${curSuffix(currency)}`} />
          <SummaryItem label="Cea mai mare categorie" value={topCategory ? `${topCategory.icon} ${topCategory.label}` : '—'} />
        </div>
      </div>

      <form className="card stagger-card" onSubmit={handleAdd} style={{ animationDelay: '0.2s' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <button type="button" onClick={() => setType('income')}
            style={toggleStyle(type === 'income', 'var(--green)')}>+ Am primit</button>
          <button type="button" onClick={() => setType('expense')}
            style={toggleStyle(type === 'expense', 'var(--red)')}>− Am cheltuit</button>
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setCategory(c.id)}
              style={{
                flexShrink: 0, padding: '8px 13px', borderRadius: 20, whiteSpace: 'nowrap', cursor: 'pointer',
                border: '1px solid var(--line)', transition: 'background .15s, color .15s',
                background: category === c.id ? 'var(--brass)' : 'rgba(0,0,0,0.2)',
                color: category === c.id ? '#2a1e08' : 'rgba(244,236,219,0.7)',
                fontWeight: category === c.id ? 600 : 400,
              }}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, margin: '10px 0' }}>
          <button type="button" onClick={() => setMethod('card')} style={toggleStyle(method === 'card', 'var(--brass)', true)}>💳 Card</button>
          <button type="button" onClick={() => setMethod('cash')} style={toggleStyle(method === 'cash', 'var(--brass)', true)}>💵 Cash</button>
        </div>

        <AmountInput value={amount} onChange={setAmount} placeholder="Sumă" />
        <input type="text" placeholder="Descriere (opțional)" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={80} />
        {error && <div className="error-msg">{error}</div>}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? <span className="spinner" /> : null}Adaugă în registru
        </button>
      </form>

      <div style={{ fontSize: 11, color: 'rgba(244,236,219,0.45)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, marginBottom: 12 }}>
        Istoric
      </div>

      {sorted.length === 0 && (
        <div style={{ textAlign: 'center', color: 'rgba(244,236,219,0.4)', padding: '36px 0', border: '1px dashed var(--line)', borderRadius: 14 }}>
          Nicio tranzacție încă
        </div>
      )}

      {sorted.map((e, i) => {
        const cat = CAT_MAP[e.category] || CAT_MAP.altele;
        const sign = e.type === 'income' ? '+' : '−';
        const dateStr = new Date(e.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        return (
          <div key={e.id} className="stagger-card" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#1c2e26', borderRadius: 14, padding: '13px 14px', marginBottom: 8, border: '1px solid var(--line)',
            animationDelay: `${Math.min(i, 8) * 0.03}s`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, background: e.type === 'income' ? 'var(--green-soft)' : 'var(--red-soft)' }}>
                {cat.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.desc}</div>
                <div style={{ fontSize: 11, color: 'rgba(244,236,219,0.4)' }}>{dateStr} · {cat.label}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, gap: 10 }}>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, color: e.type === 'income' ? '#6fd196' : '#e08672' }}>
                {sign}{fmt(e.amount)} {curSuffix(e.currency || 'RON')}
              </div>
              <button onClick={() => handleDelete(e.id)} style={{ background: 'none', border: 'none', color: 'rgba(244,236,219,0.35)', fontSize: 17, cursor: 'pointer' }}>✕</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(244,236,219,0.45)', marginTop: 3 }}>{label}</div>
    </div>
  );
}

function toggleStyle(active, activeColor, small) {
  return {
    flex: 1, padding: small ? '8px 6px' : '11px', border: 'none', borderRadius: 9, cursor: 'pointer',
    fontWeight: 600, fontSize: small ? 12.5 : 14, transition: 'background .15s, transform .12s',
    background: active ? activeColor : 'rgba(0,0,0,0.25)',
    color: active ? (activeColor === 'var(--brass)' ? '#2a1e08' : '#fff') : 'rgba(244,236,219,0.55)',
  };
}
