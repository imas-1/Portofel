import { useMemo, useState } from 'react';
import { useData, CATEGORIES, CAT_MAP, curSuffix, suggestCategory } from '../context/DataContext';
import { useSnackbar } from '../context/SnackbarContext';
import useCountUp from '../hooks/useCountUp';
import useTransactionFilters from '../hooks/useTransactionFilters';
import usePullToRefresh from '../hooks/usePullToRefresh';
import useHaptic from '../hooks/useHaptic';
import AmountInput, { parseAmountInput } from '../components/AmountInput';
import FilterPanel from '../components/FilterPanel';
import SwipeableRow from '../components/SwipeableRow';
import QuickAmountEditSheet from '../components/QuickAmountEditSheet';
import SkeletonList from '../components/Skeleton';
import { fmt, monthKey } from '../utils/format';
import CurrencySwitch from '../components/CurrencySwitch';

function currentMonthKey() {
  return monthKey(Date.now());
}

function previousMonthKey() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return monthKey(d.getTime());
}

export default function Dashboard() {
  const { entries, spaces, loaded, addEntry, editEntry, deleteEntry } = useData();
  const { showSnackbar } = useSnackbar();
  const haptic = useHaptic();
  const { active: ptrActive, refreshing: ptrRefreshing, handlers: ptrHandlers } = usePullToRefresh();
  const [currency, setCurrency] = useState('RON');
  const [type, setType] = useState('income');
  const [category, setCategory] = useState('salariu');
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [method, setMethod] = useState('card');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [removingIds, setRemovingIds] = useState(() => new Set());
  const [quickEditEntry, setQuickEditEntry] = useState(null);

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
  const thisMonthEntries = useMemo(
    () => curEntries.filter((e) => monthKey(e.createdAt) === thisMonthKey),
    [curEntries, thisMonthKey]
  );
  const prevMonthEntries = useMemo(
    () => curEntries.filter((e) => monthKey(e.createdAt) === prevMonthKey),
    [curEntries, prevMonthKey]
  );

  const { thisMonthSavings, prevMonthSavings, savingsDelta } = useMemo(() => {
    const thisMonthSavings =
      thisMonthEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0) -
      thisMonthEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    const prevMonthSavings =
      prevMonthEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0) -
      prevMonthEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    return { thisMonthSavings, prevMonthSavings, savingsDelta: thisMonthSavings - prevMonthSavings };
  }, [thisMonthEntries, prevMonthEntries]);

  // Ultima tranzacție
  const lastTransaction = [...curEntries].sort((a, b) => b.createdAt - a.createdAt)[0];

  // Rezumatul lunii: nr. tranzacții, medie zilnică cheltuită, categoria principală
  const daysSoFar = new Date().getDate();
  const { dailyAvg, categoryTotals, topCategory } = useMemo(() => {
    const thisMonthExpense = thisMonthEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    const dailyAvg = daysSoFar > 0 ? thisMonthExpense / daysSoFar : 0;
    const categoryTotals = {};
    thisMonthEntries.filter((e) => e.type === 'expense').forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
    const topCategoryId = Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a])[0];
    const topCategory = topCategoryId ? CAT_MAP[topCategoryId] : null;
    return { dailyAvg, categoryTotals, topCategory };
  }, [thisMonthEntries, daysSoFar]);

  const { filters, setFilter, reset: resetFilters, filtered, activeCount } = useTransactionFilters(curEntries);
  const [showFilters, setShowFilters] = useState(false);
  const sorted = [...filtered].sort((a, b) => b.createdAt - a.createdAt).slice(0, 100);

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
      if (editingId) {
        await editEntry(editingId, { type, amount: val, category, method, currency, desc });
        setEditingId(null);
      } else {
        await addEntry({ type, amount: val, category, method, currency, desc });
      }
      setAmount('');
      setDesc('');
      setCategoryTouched(false);
      haptic(12);
      setSavedPulse(true);
      setTimeout(() => setSavedPulse(false), 700);
      if (document.activeElement) document.activeElement.blur(); // închide tastatura
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleEditStart(entry) {
    setEditingId(entry.id);
    setType(entry.type);
    setCategory(entry.category);
    setCategoryTouched(true);
    setMethod(entry.method || 'card');
    setAmount(String(entry.amount));
    setDesc(entry.desc || '');
    haptic(10);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setAmount('');
    setDesc('');
    setError('');
    setCategoryTouched(false);
  }

  async function handleDelete(entry) {
    haptic(15);
    setRemovingIds((prev) => new Set(prev).add(entry.id));
    setTimeout(async () => {
      await deleteEntry(entry.id);
      showSnackbar('Tranzacție ștearsă', {
        actionLabel: 'Anulează',
        onAction: async () => {
          const { id, ...rest } = entry;
          await addEntry(rest);
          haptic(10);
        },
      });
    }, 230);
  }

  return (
    <div className="app-shell" {...ptrHandlers}>
      <div className={`ptr-indicator ${ptrActive ? 'active' : ''}`}>
        {ptrRefreshing ? <span className="spinner" /> : '↓'} {ptrRefreshing ? 'Se actualizează...' : 'Trage pentru actualizare'}
      </div>
      <div className="brand-row">
        <div>
          <div className="brand">Portofel</div>
          <div className="brand-tag">Registru personal</div>
        </div>
      </div>

      <CurrencySwitch currency={currency} onChange={setCurrency} />

      <div className="ledger stagger-card currency-fade" key={currency}>
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
              onClick={() => { setCategory(c.id); setCategoryTouched(true); }}
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
        <input
          type="text"
          placeholder="Descriere (opțional)"
          value={desc}
          onChange={(e) => {
            const val = e.target.value;
            setDesc(val);
            if (!categoryTouched) {
              const suggestion = suggestCategory(val);
              if (suggestion) setCategory(suggestion);
            }
          }}
          maxLength={80}
        />
        {error && <div className="error-msg">{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className={`btn-primary ${savedPulse ? 'btn-pulse' : ''}`} disabled={busy} style={{ flex: 1 }}>
            {busy ? <span className="spinner" /> : savedPulse ? '✓ ' : null}{savedPulse ? 'Salvat' : editingId ? 'Salvează modificarea' : 'Adaugă în registru'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit} style={{ ...toggleStyle(false, 'var(--brass)'), flexShrink: 0, padding: '0 18px' }}>
              Anulează
            </button>
          )}
        </div>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: 'rgba(244,236,219,0.45)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>
          Istoric
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(244,236,219,0.06)',
            border: '1px solid var(--line)', borderRadius: 20, padding: '6px 12px', cursor: 'pointer',
            color: 'rgba(244,236,219,0.7)', fontSize: 12.5, fontWeight: 600,
          }}
        >
          🔍 Filtre{activeCount > 0 ? ` (${activeCount})` : ''}
        </button>
      </div>

      {showFilters && (
        <FilterPanel
          filters={filters}
          setFilter={setFilter}
          reset={resetFilters}
          activeCount={activeCount}
          spaces={spaces}
        />
      )}

      {!loaded && <SkeletonList rows={5} />}

      {loaded && sorted.length === 0 && (
        <div style={{ textAlign: 'center', color: 'rgba(244,236,219,0.4)', padding: '36px 0', border: '1px dashed var(--line)', borderRadius: 14 }}>
          <div className="empty-state-icon" style={{ fontSize: 32, marginBottom: 8 }}>{curEntries.length === 0 ? '📖' : '🔍'}</div>
          {curEntries.length === 0 ? 'Nicio tranzacție încă' : 'Nimic găsit pentru filtrul curent'}
        </div>
      )}

      {loaded && sorted.map((e, i) => {
        const cat = CAT_MAP[e.category] || CAT_MAP.altele;
        const sign = e.type === 'income' ? '+' : '−';
        const dateStr = new Date(e.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        return (
          <SwipeableRow key={e.id} onDelete={() => handleDelete(e)} onEdit={() => handleEditStart(e)} collapsing={removingIds.has(e.id)}>
            <div
              className="stagger-card"
              onClick={() => setQuickEditEntry(e)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                background: '#1c2e26', padding: '13px 14px', border: '1px solid var(--line)',
                animationDelay: `${Math.min(i, 8) * 0.03}s`,
              }}
            >
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
              </div>
            </div>
          </SwipeableRow>
        );
      })}

      <QuickAmountEditSheet
        open={!!quickEditEntry}
        onClose={() => setQuickEditEntry(null)}
        initialAmount={quickEditEntry?.amount}
        onSave={async (val) => {
          await editEntry(quickEditEntry.id, { amount: val });
          haptic(10);
        }}
      />
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
