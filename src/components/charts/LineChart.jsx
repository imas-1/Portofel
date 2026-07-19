/**
 * Line chart cu arie umplută, în SVG. points = [{ label, value }]
 */
export default function LineChart({ points, color = '#c99a3e', height = 110 }) {
  if (points.length < 2) {
    return (
      <div style={{ textAlign: 'center', color: 'rgba(244,236,219,0.4)', padding: '20px 0', fontSize: 13 }}>
        Nu sunt suficiente date pentru un trend.
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  const range = max - min || 1;
  const stepX = 100 / (points.length - 1);
  const chartH = height - 16;

  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = chartH - ((p.value - min) / range) * (chartH - 6);
    return { x, y };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${chartH} L 0 ${chartH} Z`;
  const gradientId = 'lineGrad-' + color.replace('#', '');

  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r="1.6" fill={color} />
      ))}
    </svg>
  );
}
