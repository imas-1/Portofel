import { memo } from 'react';

/**
 * Bar chart cu două serii, în SVG. months = [{ label, a, b }]
 */
function BarChart({ months, colorA, colorB, height = 130 }) {
  const maxVal = Math.max(1, ...months.map((m) => Math.max(m.a, m.b)));
  const groupW = 100 / months.length;
  const barW = Math.min(9, groupW * 0.32);
  const chartH = height - 20;

  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      {months.map((m, i) => {
        const cx = groupW * i + groupW / 2;
        const aH = (m.a / maxVal) * (chartH - 6);
        const bH = (m.b / maxVal) * (chartH - 6);
        return (
          <g key={i}>
            <rect x={cx - barW - 1} y={chartH - aH} width={barW} height={aH} rx={1.4} fill={colorA} />
            <rect x={cx + 1} y={chartH - bH} width={barW} height={bH} rx={1.4} fill={colorB} />
            <text x={cx} y={height - 4} fontSize="3.6" fill="rgba(244,236,219,0.45)" textAnchor="middle">
              {m.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default memo(BarChart);
