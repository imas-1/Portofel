/**
 * Donut chart simplu în SVG. data = [{ label, value, color, icon }]
 * Fără librării externe — desenat manual cu stroke-dasharray pe cercuri concentrice.
 */
export default function PieChart({ data, size = 180, thickness = 26 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  if (total <= 0) {
    return (
      <div style={{ textAlign: 'center', color: 'rgba(244,236,219,0.4)', padding: '30px 0', fontSize: 13 }}>
        Nu există date pentru perioada selectată.
      </div>
    );
  }

  let cumulative = 0;
  const segments = data.map((d) => {
    const fraction = d.value / total;
    const dash = fraction * circumference;
    const offset = cumulative * circumference;
    cumulative += fraction;
    return { ...d, dash, offset, fraction };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
      <svg width={size} height={size} style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(244,236,219,0.08)" strokeWidth={thickness} />
        {segments.map((s, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div style={{ flex: 1, minWidth: 140 }}>
        {segments
          .sort((a, b) => b.value - a.value)
          .map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, fontSize: 12.5 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.icon} {s.label}
              </span>
              <span style={{ color: 'rgba(244,236,219,0.5)', fontFamily: 'IBM Plex Mono, monospace' }}>
                {Math.round(s.fraction * 100)}%
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
