export function triggerDownload(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvEscape(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function buildEntriesCSV(entries, spaces) {
  const spaceMap = Object.fromEntries(spaces.map((s) => [s.id, s.name]));
  const header = ['Data', 'Ora', 'Tip', 'Sumă', 'Monedă', 'Categorie', 'Metodă', 'Descriere', 'Spațiu'];
  const rows = [...entries]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((e) => {
      const d = new Date(e.createdAt);
      return [
        d.toLocaleDateString('ro-RO'),
        d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
        e.type === 'income' ? 'Venit' : 'Cheltuială',
        e.amount.toFixed(2).replace('.', ','),
        e.currency || 'RON',
        e.category || 'altele',
        e.method || 'card',
        e.desc || '',
        e.spaceId ? spaceMap[e.spaceId] || '' : '',
      ];
    });
  const lines = [header, ...rows].map((row) => row.map(csvEscape).join(','));
  return '\uFEFF' + lines.join('\r\n'); // BOM pentru diacritice corecte în Excel
}

export function buildBackupJSON({ entries, spaces, goals }) {
  const payload = {
    app: 'Portofel',
    exportedAt: new Date().toISOString(),
    version: 1,
    entries,
    spaces,
    goals,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseBackupJSON(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object') throw new Error('Fișier invalid.');
  if (!Array.isArray(data.entries)) throw new Error('Fișierul nu conține un backup Portofel valid.');
  return {
    entries: data.entries || [],
    spaces: data.spaces || [],
    goals: data.goals || [],
  };
}

/**
 * "Export PDF" fără nicio librărie externă — deschide o fereastră nouă cu un
 * raport HTML curat, formatat pentru tipar, și declanșează dialogul de
 * printare al browserului. De acolo utilizatorul alege "Salvează ca PDF"
 * (opțiune nativă pe iOS, Android, Mac, Windows) — nu există dependențe
 * netestabile în acest mediu, e o tehnică 100% sigură.
 */
export function openPrintableReport(entries, spaces) {
  const spaceMap = Object.fromEntries(spaces.map((s) => [s.id, s.name]));
  const sorted = [...entries].sort((a, b) => a.createdAt - b.createdAt);
  const totalIncome = entries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);

  const rowsHtml = sorted.map((e) => {
    const d = new Date(e.createdAt);
    return `<tr>
      <td>${d.toLocaleDateString('ro-RO')}</td>
      <td>${e.type === 'income' ? 'Venit' : 'Cheltuială'}</td>
      <td style="text-align:right">${e.amount.toFixed(2)} ${e.currency || 'RON'}</td>
      <td>${e.category || ''}</td>
      <td>${(e.desc || '').replace(/</g, '&lt;')}</td>
      <td>${e.spaceId ? (spaceMap[e.spaceId] || '') : ''}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="ro"><head><meta charset="UTF-8"><title>Portofel — Raport tranzacții</title>
<style>
  body { font-family: Georgia, serif; padding: 32px; color: #1b3328; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .sub { color: #666; font-size: 12px; margin-bottom: 20px; }
  .summary { display: flex; gap: 24px; margin-bottom: 24px; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { padding: 6px 8px; border-bottom: 1px solid #ddd; text-align: left; }
  th { background: #f4ecdb; }
  @media print { body { padding: 0; } }
</style></head>
<body>
  <h1>Portofel — Raport tranzacții</h1>
  <div class="sub">Generat la ${new Date().toLocaleString('ro-RO')}</div>
  <div class="summary">
    <div><strong>Total venituri:</strong> ${totalIncome.toFixed(2)}</div>
    <div><strong>Total cheltuieli:</strong> ${totalExpense.toFixed(2)}</div>
    <div><strong>Sold:</strong> ${(totalIncome - totalExpense).toFixed(2)}</div>
  </div>
  <table>
    <thead><tr><th>Data</th><th>Tip</th><th>Sumă</th><th>Categorie</th><th>Descriere</th><th>Spațiu</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <script>window.onload = () => window.print();</script>
</body></html>`;

  const win = window.open('', '_blank');
  if (!win) throw new Error('Browserul a blocat fereastra nouă — permite pop-up-uri pentru acest site.');
  win.document.write(html);
  win.document.close();
}
