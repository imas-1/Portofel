import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, computeGoalStats, curSuffix } from '../context/DataContext';
import GoalFormSheet from '../components/GoalFormSheet';

function fmt(n) {
  return n.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Goals() {
  const { goals, createGoal } = useData();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  const active = goals.filter((g) => !g.completed);
  const completed = goals.filter((g) => g.completed);

  return (
    <div className="app-shell">
      <div className="brand-row">
        <div>
          <div className="brand">Obiective</div>
          <div className="brand-tag">Economii cu un scop</div>
        </div>
      </div>

      {active.length === 0 && completed.length === 0 && (
        <div style={{ textAlign: 'center', color: 'rgba(244,236,219,0.4)', padding: '30px 0' }}>
          Niciun obiectiv încă — creează primul mai jos.
        </div>
      )}

      {active.map((g) => (
        <GoalCard key={g.id} goal={g} onOpen={() => navigate(`/obiective/${g.id}`)} />
      ))}

      <button type="button" onClick={() => setSheetOpen(true)} style={newBtnStyle}>
        🎯 Creează obiectiv nou
      </button>

      {completed.length > 0 && (
        <>
          <div className="chart-title-row" style={{ marginTop: 10 }}>🎉 Obiective atinse</div>
          {completed.map((g) => (
            <GoalCard key={g.id} goal={g} onOpen={() => navigate(`/obiective/${g.id}`)} dimmed />
          ))}
        </>
      )}

      <GoalFormSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSave={createGoal} />
    </div>
  );
}

function GoalCard({ goal, onOpen, dimmed }) {
  const stats = computeGoalStats(goal);
  return (
    <div
      className="stagger-card"
      onClick={onOpen}
      style={{
        background: 'rgba(244,236,219,0.06)', border: '1px solid var(--line)',
        borderLeft: `4px solid ${goal.color || '#c99a3e'}`, borderRadius: 16, padding: 16, marginBottom: 10,
        cursor: 'pointer', opacity: dimmed ? 0.7 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, background: 'rgba(0,0,0,0.25)', flexShrink: 0 }}>
          {goal.emoji || '🎯'}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{goal.name}{goal.completed ? ' 🎉' : ''}</div>
          <div style={{ fontSize: 11, color: 'rgba(244,236,219,0.45)' }}>{stats.estimateLabel}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 16, fontWeight: 600 }}>
          {fmt(stats.current)} {curSuffix(goal.currency)}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(244,236,219,0.45)', fontFamily: 'IBM Plex Mono, monospace' }}>
          din {fmt(stats.target)} {curSuffix(goal.currency)}
        </div>
      </div>

      <div style={{ height: 8, borderRadius: 6, background: 'rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 6, width: `${stats.pct}%`,
          background: goal.color || '#c99a3e', transition: 'width 0.7s cubic-bezier(.2,.8,.2,1)',
        }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(244,236,219,0.6)', marginTop: 6 }}>{stats.pct}%</div>
    </div>
  );
}

const newBtnStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
  border: '1.5px dashed var(--line)', background: 'transparent', borderRadius: 16, padding: 18,
  cursor: 'pointer', color: 'rgba(244,236,219,0.55)', fontWeight: 600, fontSize: 14, marginBottom: 16,
};
