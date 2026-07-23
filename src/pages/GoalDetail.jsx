import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData, computeGoalStats, curSuffix } from '../context/DataContext';
import { useSnackbar } from '../context/SnackbarContext';
import useHaptic from '../hooks/useHaptic';
import ContributionSheet from '../components/ContributionSheet';
import GoalFormSheet from '../components/GoalFormSheet';
import Confetti from '../components/Confetti';
import SwipeableRow from '../components/SwipeableRow';
import QuickAmountEditSheet from '../components/QuickAmountEditSheet';
import { fmt } from '../utils/format';

export default function GoalDetail() {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const { goals, addContribution, deleteContribution, editContribution, updateGoal, deleteGoal } = useData();
  const { showSnackbar } = useSnackbar();
  const haptic = useHaptic();
  const goal = goals.find((g) => g.id === goalId);

  const [contribSheetOpen, setContribSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [wasCompleted, setWasCompleted] = useState(goal?.completed || false);
  const [removingIds, setRemovingIds] = useState(() => new Set());
  const [quickEditContrib, setQuickEditContrib] = useState(null);

  useEffect(() => {
    if (goal && goal.completed && !wasCompleted) {
      setShowConfetti(true);
      setWasCompleted(true);
      const t = setTimeout(() => setShowConfetti(false), 2800);
      return () => clearTimeout(t);
    }
    if (goal) setWasCompleted(goal.completed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal?.completed]);

  if (!goal) {
    return (
      <div className="app-shell">
        <Link to="/obiective" style={{ color: 'var(--paper)' }}>← Înapoi</Link>
        <div className="card" style={{ marginTop: 16 }}>Obiectivul nu a fost găsit.</div>
      </div>
    );
  }

  const stats = computeGoalStats(goal);
  const sortedContribs = [...goal.contributions].sort((a, b) => b.createdAt - a.createdAt);

  async function handleAddContribution(fields) {
    await addContribution(goal.id, fields);
  }

  async function handleDeleteContrib(contrib) {
    haptic(15);
    setRemovingIds((prev) => new Set(prev).add(contrib.id));
    setTimeout(async () => {
      await deleteContribution(goal.id, contrib.id);
      showSnackbar('Contribuție ștearsă', {
        actionLabel: 'Anulează',
        onAction: async () => {
          await addContribution(goal.id, { amount: contrib.amount, note: contrib.note, createdAt: contrib.createdAt });
          haptic(10);
        },
      });
    }, 230);
  }

  async function handleDelete() {
    setMenuOpen(false);
    if (!confirm(`Ștergi obiectivul „${goal.name}"? Toate contribuțiile se pierd.`)) return;
    await deleteGoal(goal.id);
    navigate('/obiective');
  }

  return (
    <div className="app-shell" style={{ paddingBottom: 110 }}>
      {showConfetti && <Confetti />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, position: 'relative' }}>
        <Link to="/obiective" style={{ color: 'var(--paper)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>← Înapoi</Link>
        <button onClick={() => setMenuOpen(!menuOpen)} style={iconBtnStyle}>⋮</button>
        {menuOpen && (
          <div style={{
            position: 'absolute', top: 36, right: 0, background: 'var(--paper)', color: 'var(--ink)',
            borderRadius: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.4)', overflow: 'hidden', zIndex: 10, minWidth: 160,
          }}>
            <button onClick={() => { setMenuOpen(false); setEditSheetOpen(true); }} style={menuItemStyle}>✏️ Editează</button>
            <button onClick={handleDelete} style={{ ...menuItemStyle, color: 'var(--red)' }}>🗑️ Șterge</button>
          </div>
        )}
      </div>

      <div className="ledger" style={{ padding: '26px 22px', textAlign: 'center' }}>
        <div style={{ width: 58, height: 58, borderRadius: 16, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, background: 'rgba(27,51,40,0.08)' }}>
          {goal.emoji}
        </div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 600 }}>{goal.name}</div>
        {goal.completed && (
          <div style={{ display: 'inline-block', background: 'rgba(63,143,95,0.15)', color: 'var(--green)', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20, marginTop: 10 }}>
            🎉 Obiectiv atins
          </div>
        )}

        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 32, fontWeight: 600, marginTop: 16 }}>
          {fmt(stats.current)} {curSuffix(goal.currency)}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>din {fmt(stats.target)} {curSuffix(goal.currency)}</div>

        <div style={{ height: 10, borderRadius: 8, background: '#e8ddc4', overflow: 'hidden', marginTop: 14 }}>
          <div style={{
            height: '100%', width: `${stats.pct}%`, background: goal.color || '#c99a3e',
            transition: 'width 0.7s cubic-bezier(.2,.8,.2,1)',
          }} />
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', marginTop: 8 }}>{stats.pct}%</div>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 6 }}>{stats.estimateLabel}</div>
      </div>

      <div className="chart-title-row" style={{ marginTop: 18 }}>Istoric contribuții</div>

      {sortedContribs.length === 0 && (
        <div style={{ textAlign: 'center', color: 'rgba(244,236,219,0.4)', padding: '30px 0', border: '1px dashed var(--line)', borderRadius: 14 }}>
          <div className="empty-state-icon" style={{ fontSize: 28, marginBottom: 6 }}>🪙</div>
          Nicio contribuție încă
        </div>
      )}

      {sortedContribs.map((c) => (
        <SwipeableRow key={c.id} onDelete={() => handleDeleteContrib(c)} collapsing={removingIds.has(c.id)}>
          <div
            onClick={() => setQuickEditContrib(c)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
              background: 'rgba(244,236,219,0.05)', borderRadius: 14, padding: '12px 14px', border: '1px solid var(--line)',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{c.note || 'Contribuție'}</div>
              <div style={{ fontSize: 11, color: 'rgba(244,236,219,0.4)' }}>
                {new Date(c.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, color: '#6fd196' }}>
              +{fmt(c.amount)} {curSuffix(goal.currency)}
            </div>
          </div>
        </SwipeableRow>
      ))}

      {document.getElementById('app-overlay-root') && createPortal(
        <button
          onClick={() => setContribSheetOpen(true)}
          className="fab-button"
        >
          +
        </button>,
        document.getElementById('app-overlay-root')
      )}

      <QuickAmountEditSheet
        open={!!quickEditContrib}
        onClose={() => setQuickEditContrib(null)}
        initialAmount={quickEditContrib?.amount}
        onSave={async (val) => {
          await editContribution(goal.id, quickEditContrib.id, { amount: val });
          haptic(10);
        }}
      />

      <ContributionSheet
        open={contribSheetOpen}
        onClose={() => setContribSheetOpen(false)}
        onSave={handleAddContribution}
        currencySuffix={curSuffix(goal.currency)}
      />
      <GoalFormSheet
        open={editSheetOpen}
        onClose={() => setEditSheetOpen(false)}
        onSave={(fields) => updateGoal(goal.id, fields)}
        initial={goal}
      />
    </div>
  );
}

const iconBtnStyle = {
  width: 34, height: 34, borderRadius: 10, border: '1px solid var(--line)', background: 'rgba(244,236,219,0.06)',
  color: 'var(--paper)', fontSize: 16, cursor: 'pointer',
};
const menuItemStyle = {
  display: 'block', width: '100%', textAlign: 'left', padding: '11px 14px', border: 'none',
  background: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)',
};
