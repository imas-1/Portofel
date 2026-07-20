import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData, computeSpaceStats, CAT_MAP, curSuffix } from '../context/DataContext';
import SpaceEntrySheet from '../components/SpaceEntrySheet';
import SpaceFormSheet from '../components/SpaceFormSheet';

function fmt(n) {
  return n.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function dayLabel(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return 'Astăzi';
  if (sameDay(d, yesterday)) return 'Ieri';
  return d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function SpaceDetail() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const { spaces, entries, addEntry, editEntry, deleteEntry, updateSpace, duplicateSpace, deleteSpace } = useData();
  const sp = spaces.find((s) => s.id === spaceId);

  const [entrySheetOpen, setEntrySheetOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formSheetOpen, setFormSheetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const stats = useMemo(() => (sp ? computeSpaceStats(entries, sp.id) : null), [entries, sp]);

  const groupedByDay = useMemo(() => {
    if (!sp) return [];
    const spaceEntries = entries.filter((e) => e.spaceId === sp.id).sort((a, b) => b.createdAt - a.createdAt);
    const groups = [];
    let currentKey = null;
    spaceEntries.forEach((e) => {
      const key = new Date(e.createdAt).toDateString();
      if (key !== currentKey) {
        groups.push({ key, label: dayLabel(e.createdAt), items: [] });
        currentKey = key;
      }
      groups[groups.length - 1].items.push(e);
    });
    return groups;
  }, [entries, sp]);

  if (!sp) {
    return (
      <div className="app-shell">
        <Link to="/spatii" style={{ color: 'var(--paper)' }}>← Înapoi</Link>
        <div className="card" style={{ marginTop: 16 }}>Spațiul nu a fost găsit.</div>
      </div>
    );
  }

  const pct = sp.budget ? Math.min(999, Math.round((stats.spent / sp.budget) * 100)) : null;
  const overBudget = sp.budget && stats.spent > sp.budget;

  async function handleAddOrEditEntry(fields) {
    if (editingEntry) await editEntry(editingEntry.id, fields);
    else await addEntry({ ...fields, spaceId: sp.id });
  }

  async function handleDeleteEntry(id) {
    if (!confirm('Ștergi această tranzacție?')) return;
    await deleteEntry(id);
  }

  async function handleDuplicate() {
    setMenuOpen(false);
    const newSpace = await duplicateSpace(sp.id);
    navigate(`/spatii/${newSpace.key}`);
  }

  async function handleArchive() {
    setMenuOpen(false);
    await updateSpace(sp.id, { archived: !sp.archived });
    navigate('/spatii');
  }

  async function handleDelete() {
    setMenuOpen(false);
    if (!confirm(`Ștergi spațiul „${sp.name}"? Tranzacțiile rămân în istoric, doar gruparea dispare.`)) return;
    await deleteSpace(sp.id);
    navigate('/spatii');
  }

  return (
    <div className="app-shell" style={{ paddingBottom: 110 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, position: 'relative' }}>
        <Link to="/spatii" style={{ color: 'var(--paper)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>← Înapoi</Link>
        <button onClick={() => setMenuOpen(!menuOpen)} style={iconBtnStyle}>⋮</button>

        {menuOpen && (
          <div style={{
            position: 'absolute', top: 36, right: 0, background: 'var(--paper)', color: 'var(--ink)',
            borderRadius: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.4)', overflow: 'hidden', zIndex: 10, minWidth: 170,
          }}>
            <MenuItem label="✏️ Editează spațiul" onClick={() => { setMenuOpen(false); setFormSheetOpen(true); }} />
            <MenuItem label="📋 Duplică" onClick={handleDuplicate} />
            <MenuItem label={sp.archived ? '♻️ Restaurează' : '🗄️ Arhivează'} onClick={handleArchive} />
            <MenuItem label="🗑️ Șterge spațiul" onClick={handleDelete} danger />
          </div>
        )}
      </div>

      <div className="ledger" style={{ padding: '26px 22px', textAlign: 'center' }}>
        <div style={{ width: 58, height: 58, borderRadius: 16, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, background: 'rgba(27,51,40,0.08)' }}>
          {sp.emoji}
        </div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 600 }}>{sp.name}</div>
        {sp.description && <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2 }}>{sp.description}</div>}
        {overBudget && (
          <div style={{ display: 'inline-block', background: 'rgba(176,80,63,0.12)', color: 'var(--red)', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20, marginTop: 10 }}>
            ⚠️ Buget depășit
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 36, margin: '18px 0 14px' }}>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--ink-soft)', fontWeight: 600 }}>Cheltuit</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 19, fontWeight: 600, marginTop: 3 }}>{fmt(stats.spent)} lei</div>
          </div>
          {sp.budget != null && (
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--ink-soft)', fontWeight: 600 }}>Buget</div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 19, fontWeight: 600, marginTop: 3, color: 'var(--ink-soft)' }}>{fmt(sp.budget)} lei</div>
            </div>
          )}
        </div>

        {sp.budget != null && (
          <>
            <div style={{ height: 10, borderRadius: 8, background: '#e8ddc4', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${Math.min(100, pct)}%`,
                background: overBudget ? 'var(--red)' : (sp.color || '#c99a3e'),
                transition: 'width 0.7s cubic-bezier(.2,.8,.2,1)',
              }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)', marginTop: 8 }}>{pct}% din buget</div>
          </>
        )}
      </div>

      <div style={{ fontSize: 11, color: 'rgba(244,236,219,0.45)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, margin: '18px 0 12px' }}>
        Tranzacții
      </div>

      {groupedByDay.length === 0 && (
        <div style={{ textAlign: 'center', color: 'rgba(244,236,219,0.4)', padding: '30px 0', border: '1px dashed var(--line)', borderRadius: 14 }}>
          Nicio tranzacție încă în acest spațiu
        </div>
      )}

      <div style={{ position: 'relative', paddingLeft: 4 }}>
        {groupedByDay.map((group, gi) => (
          <div key={group.key} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(244,236,219,0.5)', marginBottom: 10, marginLeft: 20 }}>
              {group.label}
            </div>
            <div style={{ position: 'relative', borderLeft: '2px solid var(--line)', marginLeft: 8, paddingLeft: 16 }}>
              {group.items.map((e) => {
                const cat = CAT_MAP[e.category] || CAT_MAP.altele;
                const sign = e.type === 'income' ? '+' : '−';
                const timeStr = new Date(e.createdAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={e.id} style={{ position: 'relative', marginBottom: 12 }}>
                    <div style={{
                      position: 'absolute', left: -21, top: 4, width: 10, height: 10, borderRadius: '50%',
                      background: e.type === 'income' ? 'var(--green)' : 'var(--red)', border: '2px solid var(--bg-0)',
                    }} />
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: 'rgba(244,236,219,0.05)', borderRadius: 14, padding: '12px 14px', border: '1px solid var(--line)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                        <div style={{ fontSize: 18, marginRight: 10 }}>{cat.icon}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.desc}</div>
                          <div style={{ fontSize: 11, color: 'rgba(244,236,219,0.4)' }}>{timeStr} · {cat.label}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, fontSize: 14, color: e.type === 'income' ? '#6fd196' : '#e08672' }}>
                          {sign}{fmt(e.amount)} {curSuffix(e.currency || 'RON')}
                        </div>
                        <button onClick={() => { setEditingEntry(e); setEntrySheetOpen(true); }} style={smallBtnStyle}>✏️</button>
                        <button onClick={() => handleDeleteEntry(e.id)} style={smallBtnStyle}>✕</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => { setEditingEntry(null); setEntrySheetOpen(true); }}
        className="fab-button"
      >
        +
      </button>

      <SpaceEntrySheet
        open={entrySheetOpen}
        onClose={() => setEntrySheetOpen(false)}
        onSave={handleAddOrEditEntry}
        initial={editingEntry}
      />
      <SpaceFormSheet
        open={formSheetOpen}
        onClose={() => setFormSheetOpen(false)}
        onSave={(fields) => updateSpace(sp.id, fields)}
        initial={sp}
      />
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

const iconBtnStyle = {
  width: 34, height: 34, borderRadius: 10, border: '1px solid var(--line)', background: 'rgba(244,236,219,0.06)',
  color: 'var(--paper)', fontSize: 16, cursor: 'pointer',
};
const smallBtnStyle = { background: 'none', border: 'none', color: 'rgba(244,236,219,0.4)', fontSize: 13, cursor: 'pointer' };
