export default function CurrencySwitch({ currency, onChange, marginBottom = 14 }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom }}>
      {['RON', 'EUR'].map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
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
  );
}
