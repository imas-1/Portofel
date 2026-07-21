import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { useSecurity } from '../context/SecurityContext';
import { useSnackbar } from '../context/SnackbarContext';
import SetPinSheet from '../components/SetPinSheet';
import { triggerDownload, buildEntriesCSV, buildBackupJSON, parseBackupJSON, openPrintableReport } from '../utils/exportData';

export default function Settings() {
  const { logout, user } = useAuth();
  const { entries, spaces, goals, restoreBackup } = useData();
  const { theme, toggleTheme } = useTheme();
  const { hasPin, biometricEnabled, removePin, toggleBiometric } = useSecurity();
  const { showSnackbar } = useSnackbar();
  const [pinSheetOpen, setPinSheetOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = useRef(null);

  function handleExportCSV() {
    const csv = buildEntriesCSV(entries, spaces);
    const stamp = new Date().toISOString().slice(0, 10);
    triggerDownload(`portofel-tranzactii-${stamp}.csv`, csv, 'text/csv;charset=utf-8');
    showSnackbar('CSV descărcat');
  }

  function handleExportPDF() {
    try {
      openPrintableReport(entries, spaces);
    } catch (err) {
      showSnackbar(err.message);
    }
  }

  function handleBackup() {
    const json = buildBackupJSON({ entries, spaces, goals });
    const stamp = new Date().toISOString().slice(0, 10);
    triggerDownload(`portofel-backup-${stamp}.json`, json, 'application/json');
    showSnackbar('Backup descărcat');
  }

  function handleRestoreClick() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoring(true);
    try {
      const text = await file.text();
      const parsed = parseBackupJSON(text);
      const confirmMsg = `Restaurezi ${parsed.entries.length} tranzacții, ${parsed.spaces.length} spații și ${parsed.goals.length} obiective? Se adaugă la ce ai deja — nu se șterge nimic existent.`;
      if (!confirm(confirmMsg)) {
        setRestoring(false);
        e.target.value = '';
        return;
      }
      const result = await restoreBackup(parsed);
      showSnackbar(`Restaurat: ${result.entriesCount} tranzacții, ${result.spacesCount} spații, ${result.goalsCount} obiective`);
    } catch (err) {
      showSnackbar('Eroare la restaurare: ' + err.message);
    } finally {
      setRestoring(false);
      e.target.value = '';
    }
  }

  return (
    <div className="app-shell">
      <div className="brand-row">
        <div>
          <div className="brand">Setări</div>
          <div className="brand-tag">{user?.email}</div>
        </div>
      </div>

      {/* ---------- Securitate ---------- */}
      <div className="chart-title-row">🔒 Securitate</div>
      <div className="card">
        <SettingsRow
          label="PIN aplicație"
          desc={hasPin ? 'Activ — blochează aplicația când o părăsești' : 'Dezactivat'}
          action={
            hasPin ? (
              <button onClick={removePin} style={dangerLinkStyle}>Dezactivează</button>
            ) : (
              <button onClick={() => setPinSheetOpen(true)} style={primaryLinkStyle}>Activează</button>
            )
          }
        />
        {hasPin && (
          <SettingsRow
            label="Face ID / amprentă"
            desc="Beta — necesită suport WebAuthn pe dispozitiv"
            action={<Toggle checked={biometricEnabled} onChange={toggleBiometric} />}
          />
        )}
      </div>

      {/* ---------- Aspect ---------- */}
      <div className="chart-title-row">🎨 Aspect</div>
      <div className="card">
        <SettingsRow
          label="Temă"
          desc={theme === 'dark' ? 'Întunecată' : 'Luminoasă (beta)'}
          action={
            <button onClick={toggleTheme} style={primaryLinkStyle}>
              {theme === 'dark' ? '☀️ Luminoasă' : '🌙 Întunecată'}
            </button>
          }
        />
      </div>

      {/* ---------- Date ---------- */}
      <div className="chart-title-row">💾 Date</div>
      <div className="card">
        <SettingsRow label="Export CSV" desc="Toate tranzacțiile, pentru Excel/Google Sheets" action={<button onClick={handleExportCSV} style={primaryLinkStyle}>Descarcă</button>} />
        <SettingsRow label="Export PDF" desc="Raport printabil, prin dialogul de tipărire" action={<button onClick={handleExportPDF} style={primaryLinkStyle}>Generează</button>} />
        <SettingsRow label="Backup complet" desc="Toate datele, într-un fișier JSON" action={<button onClick={handleBackup} style={primaryLinkStyle}>Descarcă</button>} />
        <SettingsRow
          label="Restaurează backup"
          desc="Reîncarcă dintr-un fișier JSON salvat anterior"
          action={
            <button onClick={handleRestoreClick} disabled={restoring} style={primaryLinkStyle}>
              {restoring ? 'Se procesează...' : 'Alege fișier'}
            </button>
          }
        />
        <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFileSelected} style={{ display: 'none' }} />
      </div>

      <button className="btn-primary" style={{ background: 'var(--red)', color: '#fff', marginTop: 4 }} onClick={logout}>
        Ieși din cont
      </button>

      <SetPinSheet open={pinSheetOpen} onClose={() => setPinSheetOpen(false)} />
    </div>
  );
}

function SettingsRow({ label, desc, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line)', gap: 10 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>{desc}</div>
      </div>
      <div style={{ flexShrink: 0 }}>{action}</div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative',
        background: checked ? 'var(--green)' : 'rgba(244,236,219,0.15)', transition: 'background .2s',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3, width: 20, height: 20, borderRadius: '50%',
        background: '#fff', transition: 'left .2s',
      }} />
    </button>
  );
}

const primaryLinkStyle = {
  background: 'none', border: '1px solid var(--line)', borderRadius: 10, padding: '7px 12px',
  color: 'var(--brass)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
};
const dangerLinkStyle = { ...primaryLinkStyle, color: 'var(--red)' };
