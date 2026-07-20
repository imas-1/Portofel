import { CATEGORIES } from '../context/DataContext';
import AmountInput from './AmountInput';

const PERIODS = [
  { id: 'all', label: 'Toate' },
  { id: '7d', label: '7 zile' },
  { id: '30d', label: '30 zile' },
  { id: 'month', label: 'Luna asta' },
  { id: 'year', label: 'Anul asta' },
];

export default function FilterPanel({ filters, setFilter, reset, activeCount, spaces, showSpaceFilter = true }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <input
        type="text"
        value={filters.search}
        onChange={(e) => setFilter('search', e.target.value)}
        placeholder="🔍 Caută în descriere..."
        style={{ marginBottom: 10 }}
      />

      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <FilterToggle label="Toate" active={filters.type === 'all'} onClick={() => setFilter('type', 'all')} />
        <FilterToggle label="+ Venit" active={filters.type === 'income'} onClick={() => setFilter('type', 'income')} color="var(--green)" />
        <FilterToggle label="− Cheltuială" active={filters.type === 'expense'} onClick={() => setFilter('type', 'expense')} color="var(--red)" />
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 10 }}>
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setFilter('period', p.id)}
            style={chipStyle(filters.period === p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 10 }}>
        <button type="button" onClick={() => setFilter('category', 'all')} style={chipStyle(filters.category === 'all')}>
          Toate categoriile
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter('category', c.id)}
            style={chipStyle(filters.category === c.id)}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {showSpaceFilter && spaces && spaces.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 10 }}>
          <button type="button" onClick={() => setFilter('spaceId', 'all')} style={chipStyle(filters.spaceId === 'all')}>
            Toate spațiile
          </button>
          <button type="button" onClick={() => setFilter('spaceId', 'none')} style={chipStyle(filters.spaceId === 'none')}>
            Fără spațiu
          </button>
          {spaces.map((sp) => (
            <button
              key={sp.id}
              type="button"
              onClick={() => setFilter('spaceId', sp.id)}
              style={chipStyle(filters.spaceId === sp.id)}
            >
              {sp.emoji} {sp.name}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <AmountInput value={filters.minAmount} onChange={(v) => setFilter('minAmount', v)} placeholder="Sumă min" style={{ marginBottom: 0 }} />
        <span style={{ color: 'rgba(244,236,219,0.4)', fontSize: 13 }}>—</span>
        <AmountInput value={filters.maxAmount} onChange={(v) => setFilter('maxAmount', v)} placeholder="Sumă max" style={{ marginBottom: 0 }} />
      </div>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 10, background: 'none', border: 'none', color: 'var(--brass)', fontSize: 12.5,
            fontWeight: 600, cursor: 'pointer', textDecoration: 'underline',
          }}
        >
          Resetează filtrele ({activeCount})
        </button>
      )}
    </div>
  );
}

function FilterToggle({ label, active, onClick, color = 'var(--brass)' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1, padding: '8px 6px', border: 'none', borderRadius: 9, cursor: 'pointer',
        fontWeight: 600, fontSize: 12.5,
        background: active ? color : 'rgba(0,0,0,0.25)',
        color: active ? (color === 'var(--brass)' ? '#2a1e08' : '#fff') : 'rgba(244,236,219,0.55)',
      }}
    >
      {label}
    </button>
  );
}

function chipStyle(active) {
  return {
    flexShrink: 0, padding: '8px 13px', borderRadius: 20, whiteSpace: 'nowrap', cursor: 'pointer',
    border: '1px solid var(--line)',
    background: active ? 'var(--brass)' : 'rgba(0,0,0,0.2)',
    color: active ? '#2a1e08' : 'rgba(244,236,219,0.7)',
    fontWeight: active ? 600 : 400, fontSize: 13,
  };
}
