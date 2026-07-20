import { useMemo, useState } from 'react';
import { useData, CAT_MAP, curSuffix } from '../context/DataContext';

const MONTH_NAMES_FULL = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
];
const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function fmt(n) {
  return n.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function dayKey(ts) {
  return new Date(ts).toISOString().slice(0, 10);
}
function isoOf(y, m, d) {
  return new Date(y, m, d).toISOString().slice(0, 10);
}

export default function Calendar() {
  const { entries } = useData();
  const [currency, setCurrency] = useState('RON');
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedKey, setSelectedKey] = useState(() => new Date().toISOString().slice(0, 10));

  const curEntries = useMemo(
    () => entries.filter((e) => (e.currency || 'RON') === currency && !e.isTransfer),
    [entries, currency]
  );

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const dayTotals = useMemo(() => {
    const map = {};
    curEntries.forEach((e) => {
      const key = dayKey(e.createdAt);
      if (!map[key]) map[key] = { income: 0, expense: 0, count: 0 };
      if (e.type === 'income') map[key].income += e.amount;
      else map[key].expense += e.amount;
      map[key].count += 1;
    });
    return map;
  }, [curEntries]);

  const grid = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // luni=0 ... duminică=6
    const startOffset = (firstOfMonth.getDay() + 6) % 7;

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const monthTotal = useMemo(() => {
    let income = 0, expense = 0;
    Object.keys(dayTotals).forEach((key) => {
      const [y, m] = key.split('-').map(Number);
      if (y === year && m - 1 === month) {
        income += dayTotals[key].income;
        expense += dayTotals[key].expense;
      }
    });
    return { income, expense };
  }, [dayTotals, year, month]);

  function goPrevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }
  function goNextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }
  function goToday() {
    const now = new Date();
    setViewDate(now);
    setSelectedKey(now.toISOString().slice(0, 10));
  }

  const selectedDayEntries = useMemo(
    () => curEntries.filter((e) => dayKey(e.createdAt) === selectedKey).sort((a, b) => b.createdAt - a.createdAt),
    [curEntries, selectedKey]
  );
  const selectedTotals = dayTotals[selectedKey] || { income: 0, expense: 0, count: 0 };

  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="app-shell">
      <div className="brand-row">
        <div>
          <div className="brand">Calendar</div>
          <div className="brand-tag">Tranzacții pe zile</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {['RON', 'EUR'].map((c) => (
          <button
            key={c}
            onClick={() => setCurrency(c)}
            style={{
              padding: '6px 16px', borderRadius: 20, cursor: 'pointer', fontWeight: 700, fontSize: 12.5,
              border: '1.5px solid rgba(244,236,219,0.25)',
              background: currency === c ? 'var(--brass)' : 'transparent',
              color: currency === c ? '#2a1e08' : 'rgba(244,236,219,0.6)',
            }}
          >
            {c === 'RON' ? 'Lei' : 'Euro'}
          </button>
        ))}
      </div>

      <div className="card stagger-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button onClick={goPrevMonth} style={navBtnStyle}>‹</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 600 }}>
              {MONTH_NAMES_FULL[month]} {year}
            </div>
            <button onClick={goToday} style={{ background: 'none', border: 'none', color: 'var(--brass)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
              Astăzi
            </button>
          </div>
          <button onClick={goNextMonth} style={navBtnStyle}>›</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {WEEKDAY_LABELS.map((w, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 10, color: 'rgba(244,236,219,0.4)', fontWeight: 700 }}>{w}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {grid.map((d, i) => {
            if (d === null) return <div key={i} />;
            const key = isoOf(year, month, d);
            const totals = dayTotals[key];
            const isSelected = key === selectedKey;
            const isToday = key === todayKey;
            return (
              <button
                key={i}
                onClick={() => setSelectedKey(key)}
                style={{
                  aspectRatio: '1', border: 'none', borderRadius: 10, cursor: 'pointer',
                  background: isSelected ? 'var(--brass)' : isToday ? 'rgba(201,154,62,0.15)' : 'rgba(244,236,219,0.05)',
                  color: isSelected ? '#2a1e08' : 'var(--paper)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: isToday || isSelected ? 700 : 500, position: 'relative', padding: 2,
                }}
              >
                {d}
                {totals && (
                  <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                    {totals.income > 0 && <span style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? '#1c5236' : 'var(--green)' }} />}
                    {totals.expense > 0 && <span style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? '#7a3325' : 'var(--red)' }} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div className="mini-stat-card stagger-card">
          <div className="mini-stat-label">Venit luna asta</div>
          <div className="mini-stat-value" style={{ color: 'var(--green)' }}>{fmt(monthTotal.income)} {curSuffix(currency)}</div>
        </div>
        <div className="mini-stat-card stagger-card">
          <div className="mini-stat-label">Cheltuit luna asta</div>
          <div className="mini-stat-value" style={{ color: 'var(--red)' }}>{fmt(monthTotal.expense)} {curSuffix(currency)}</div>
        </div>
      </div>

      <div className="chart-title-row">
        {new Date(selectedKey).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })}
      </div>

      <div className="card stagger-card" style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        <SummaryItem label="Venit" value={`${fmt(selectedTotals.income)} ${curSuffix(currency)}`} color="var(--green)" />
        <SummaryItem label="Cheltuit" value={`${fmt(selectedTotals.expense)} ${curSuffix(currency)}`} color="var(--red)" />
        <SummaryItem label="Sold zi" value={`${fmt(selectedTotals.income - selectedTotals.expense)} ${curSuffix(currency)}`} />
      </div>

      {selectedDayEntries.length === 0 && (
        <div style={{ textAlign: 'center', color: 'rgba(244,236,219,0.4)', padding: '24px 0', border: '1px dashed var(--line)', borderRadius: 14 }}>
          Nicio tranzacție în această zi
        </div>
      )}

      {selectedDayEntries.map((e) => {
        const cat = CAT_MAP[e.category] || CAT_MAP.altele;
        const sign = e.type === 'income' ? '+' : '−';
        const timeStr = new Date(e.createdAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
        return (
          <div key={e.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#1c2e26', borderRadius: 14, padding: '13px 14px', marginBottom: 8, border: '1px solid var(--line)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, background: e.type === 'income' ? 'var(--green-soft)' : 'var(--red-soft)' }}>
                {cat.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.desc}</div>
                <div style={{ fontSize: 11, color: 'rgba(244,236,219,0.4)' }}>{timeStr} · {cat.label}</div>
              </div>
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, color: e.type === 'income' ? '#6fd196' : '#e08672' }}>
              {sign}{fmt(e.amount)} {curSuffix(e.currency || 'RON')}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SummaryItem({ label, value, color }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace', color: color || 'var(--paper)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(244,236,219,0.45)', marginTop: 3 }}>{label}</div>
    </div>
  );
}

const navBtnStyle = {
  width: 34, height: 34, borderRadius: 10, border: '1px solid var(--line)', background: 'rgba(244,236,219,0.06)',
  color: 'var(--paper)', fontSize: 18, cursor: 'pointer',
};
