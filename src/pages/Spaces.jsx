import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, computeSpaceStats, relativeTime } from '../context/DataContext';
import SpaceFormSheet from '../components/SpaceFormSheet';
import { SkeletonCard } from '../components/Skeleton';

function fmt(n) {
  return n.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function sortSpaces(list, sortVal, entries) {
  const withStats = list.map((sp) => ({ sp, stats: computeSpaceStats(entries, sp.id) }));
  if (sortVal === 'over-budget') {
    withStats.sort((a, b) => {
      const aOver = a.sp.budget && a.stats.spent > a.sp.budget ? 1 : 0;
      const bOver = b.sp.budget && b.stats.spent > b.sp.budget ? 1 : 0;
      if (aOver !== bOver) return bOver - aOver;
      return b.sp.createdAt - a.sp.createdAt;
    });
  } else if (sortVal === 'active') {
    withStats.sort((a, b) => b.stats.count - a.stats.count);
  } else if (sortVal === 'name') {
    withStats.sort((a, b) => a.sp.name.localeCompare(b.sp.name, 'ro'));
  } else {
    withStats.sort((a, b) => b.sp.createdAt - a.sp.createdAt);
  }
  return withStats.map((x) => x.sp);
}

export default function Spaces() {
  const { spaces, entries, loaded, createSpace, updateSpace, duplicateSpace, deleteSpace } = useData();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [sortBy, setSortBy] = useState('recent');
  const [showArchived, setShowArchived] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const active = useMemo(() => sortSpaces(spaces.filter((s) => !s.archived), sortBy, entries), [spaces, sortBy, entries]);
  const archived = useMemo(() => spaces.filter((s) => s.archived), [spaces]);

  async function handleSave(fields) {
    if (editingSpace) await updateSpace(editingSpace.id, fields);
    else await createSpace(fields);
  }

  async function handleDuplicate(id) {
    setMenuOpenId(null);
    await duplicateSpace(id);
  }

  async function handleArchiveToggle(sp) {
    setMenuOpenId(null);
    await updateSpace(sp.id, { archived: !sp.archived });
  }

  async function handleDelete(sp) {
    setMenuOpenId(null);
    if (!confirm(`Ștergi spațiul „${sp.name}"? Tranzacțiile rămân în istoric, doar gruparea dispare.`)) return;
    await deleteSpace(sp.id);
  }

  function openEdit(sp) {
    setMenuOpenId(null);
    setEditingSpace(sp);
    setSheetOpen(true);
  }

  function openCreate() {
    setEditingSpace(null);
    setSheetOpen(true);
  }

  return (
    <div className="app-shell">
      <div className="brand-row">
        <div>
          <div className="brand">Spațiile mele</div>
          <div className="brand-tag">Organizare pe scopuri</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'rgba(0,0,0,0.25)', color: 'rgba(244,236,219,0.7)', fontSize: 12 }}
        >
          <option value="recent">Recente</option>
          <option value="over-budget">Buget depășit primul</option>
          <option value="active">Cele mai active</option>
          <option value="name">Alfabetic</option>
        </select>
      </div>

      {!loaded && (
        <>
          <SkeletonCard />
          <SkeletonCard />
        </>
      )}

      {loaded && active.map((sp) => (
        <SpaceCard
          key={sp.id}
          sp={sp}
          entries={entries}
          menuOpen={menuOpenId === sp.id}
          onToggleMenu={() => setMenuOpenId(menuOpenId === sp.id ? null : sp.id)}
          onOpen={() => navigate(`/spatii/${sp.id}`)}
          onEdit={() => openEdit(sp)}
          onDuplicate={() => handleDuplicate(sp.id)}
          onArchive={() => handleArchiveToggle(sp)}
          onDelete={() => handleDelete(sp)}
        />
      ))}

      <button type="button" onClick={openCreate} style={newSpaceBtnStyle}>
        ➕ Creează spațiu nou
      </button>

      {archived.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            style={{
              width: '100%', textAlign: 'left', background: 'transparent', border: '1px dashed var(--line)',
              color: 'rgba(244,236,219,0.55)', fontSize: 13, fontWeight: 600, padding: '12px 14px',
              borderRadius: 14, cursor: 'pointer', marginBottom: 10,
            }}
          >
            🗄️ Spații arhivate ({archived.length}) {showArchived ? '▴' : '▾'}
          </button>
          {showArchived && archived.map((sp) => (
            <SpaceCard
              key={sp.id}
              sp={sp}
              entries={entries}
              dimmed
              menuOpen={menuOpenId === sp.id}
              onToggleMenu={() => setMenuOpenId(menuOpenId === sp.id ? null : sp.id)}
              onOpen={() => navigate(`/spatii/${sp.id}`)}
              onEdit={() => openEdit(sp)}
              onDuplicate={() => handleDuplicate(sp.id)}
              onArchive={() => handleArchiveToggle(sp)}
              onDelete={() => handleDelete(sp)}
            />
          ))}
        </div>
      )}

      <SpaceFormSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSave={handleSave} initial={editingSpace} />
    </div>
  );
}

function SpaceCard({ sp, entries, dimmed, menuOpen, onToggleMenu, onOpen, onEdit, onDuplicate, onArchive, onDelete }) {
  const stats = computeSpaceStats(entries, sp.id);
  const pct = sp.budget ? Math.min(999, Math.round((stats.spent / sp.budget) * 100)) : null;
  const overBudget = sp.budget && stats.spent > sp.budget;
  const remaining = sp.budget ? sp.budget - stats.spent : null;

  return (
    <div
      style={{
        position: 'relative',
        background: 'rgba(244,236,219,0.06)', border: '1px solid var(--line)',
        borderLeft: `4px solid ${sp.color || '#c99a3e'}`, borderRadius: 16, padding: 16, marginBottom: 10,
        opacity: dimmed ? 0.6 : 1, cursor: 'pointer',
      }}
      onClick={onOpen}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, background: 'rgba(0,0,0,0.25)', flexShrink: 0 }}>
          {sp.emoji || '📁'}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {sp.name}{overBudget ? ' ⚠️' : ''}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(244,236,219,0.45)' }}>
            {stats.count} tranzacții · {relativeTime(stats.lastUpdated)}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleMenu(); }}
          style={{ background: 'none', border: 'none', color: 'rgba(244,236,219,0.5)', fontSize: 18, cursor: 'pointer', padding: 4 }}
        >
          ⋮
        </button>
      </div>

      {menuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', top: 44, right: 12, background: 'var(--paper)', color: 'var(--ink)',
            borderRadius: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.4)', overflow: 'hidden', zIndex: 10, minWidth: 160,
          }}
        >
          <MenuItem label="✏️ Editează" onClick={onEdit} />
          <MenuItem label="📋 Duplică" onClick={onDuplicate} />
          <MenuItem label={sp.archived ? '♻️ Restaurează' : '🗄️ Arhivează'} onClick={onArchive} />
          <MenuItem label="🗑️ Șterge" onClick={onDelete} danger />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(244,236,219,0.45)' }}>Cheltuit</div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 16, fontWeight: 600 }}>{fmt(stats.spent)} lei</div>
        </div>
        {sp.budget != null && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(244,236,219,0.45)' }}>Rămas</div>
            <div style={{ fontSize: 13, fontFamily: 'IBM Plex Mono, monospace', color: remaining < 0 ? 'var(--red)' : 'var(--green)' }}>
              {fmt(remaining)} lei
            </div>
          </div>
        )}
      </div>

      {sp.budget != null && (
        <>
          <div style={{ height: 8, borderRadius: 6, background: 'rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%', borderRadius: 6, width: `${Math.min(100, pct)}%`,
                background: overBudget ? 'var(--red)' : (sp.color || '#c99a3e'),
                transition: 'width 0.7s cubic-bezier(.2,.8,.2,1)',
              }}
            />
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(244,236,219,0.6)', marginTop: 6 }}>
            {pct}%{overBudget ? ' · depășit' : ''} din {fmt(sp.budget)} lei
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({ label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', textAlign: 'left', padding: '11px 14px', border: 'none',
        background: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600,
        color: danger ? 'var(--red)' : 'var(--ink)',
      }}
    >
      {label}
    </button>
  );
}

const newSpaceBtnStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
  border: '1.5px dashed var(--line)', background: 'transparent', borderRadius: 16, padding: 18,
  cursor: 'pointer', color: 'rgba(244,236,219,0.55)', fontWeight: 600, fontSize: 14, marginBottom: 16,
};
