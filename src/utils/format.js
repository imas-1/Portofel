export function fmt(n) {
  return n.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const MONTH_NAMES = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export const MONTH_NAMES_FULL = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
];

export function monthKey(ts) {
  const d = new Date(ts);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

export function dayKey(ts) {
  return new Date(ts).toISOString().slice(0, 10);
}

export function last6Months() {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), label: MONTH_NAMES[d.getMonth()] });
  }
  return months;
}

/** Sold Card / Cash calculat din tranzacții (venituri - cheltuieli, per metodă). */
export function computeMethodTotals(entries) {
  let card = 0;
  let cash = 0;
  entries.forEach((e) => {
    const signed = e.type === 'income' ? e.amount : -e.amount;
    if (e.method === 'cash') cash += signed;
    else card += signed;
  });
  return { card, cash };
}
