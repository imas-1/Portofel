import { useMemo, useState } from 'react';
import { useData, CATEGORIES, CAT_MAP, curSuffix } from '../context/DataContext';
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
import LineChart from '../components/charts/LineChart';
import { fmt, monthKey, last6Months, dayKey, computeMethodTotals } from '../utils/format';
import CurrencySwitch from '../components/CurrencySwitch';

const PALETTE = ['#c99a3e', '#3f8f5f', '#4f7cd6', '#b0503f', '#8b5fbf', '#3ba7a0', '#d68a4c', '#6b8e4e', '#a4577a', '#5a7d9a'];

function last30Days() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ key: d.toISOString().slice(0, 10), label: d.getDate() + '/' + (d.getMonth() + 1) });
  }
  return days;
}

export default function Stats() {
  const { entries } = useData();
  const [currency, setCurrency] = useState('RON');

  const curEntries = useMemo(
    () => entries.filter((e) => (e.currency || 'RON') === currency && !e.isTransfer),
    [entries, currency]
  );

  const totalIncome = curEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExpense = curEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const totalSavings = totalIncome - totalExpense;

  const biggestExpense = useMemo(
    () => curEntries.filter((e) => e.type === 'expense').sort((a, b) => b.amount - a.amount)[0],
    [curEntries]
  );
  const biggestIncome = useMemo(
    () => curEntries.filter((e) => e.type === 'income').sort((a, b) => b.amount - a.amount)[0],
    [curEntries]
  );

  const firstEntryDate = useMemo(
    () => curEntries.reduce((min, e) => Math.min(min, e.createdAt), Date.now()),
    [curEntries]
  );
  const daysTracked = Math.max(1, Math.round((Date.now() - firstEntryDate) / 86400000));
  const dailyAvg = totalExpense / daysTracked;

  const categoryTotals = useMemo(() => {
    const map = {};
    curEntries.filter((e) => e.type === 'expense').forEach((e) => {
      map[e.category || 'altele'] = (map[e.category || 'altele'] || 0) + e.amount;
    });
    return map;
  }, [curEntries]);

  const topCategoryId = Object.keys(categoryTotals).sort((a, b) => categoryTotals[b] - categoryTotals[a])[0];
  const topCategory = topCategoryId ? CAT_MAP[topCategoryId] : null;

  const { card: cardBalance, cash: cashBalance } = useMemo(() => computeMethodTotals(curEntries), [curEntries]);
  const methodTotal = Math.abs(cardBalance) + Math.abs(cashBalance);
  const cardPct = methodTotal > 0 ? Math.round((Math.abs(cardBalance) / methodTotal) * 100) : 50;
  const cashPct = 100 - cardPct;

  const preferredMethod = useMemo(() => {
    let cardCount = 0, cashCount = 0;
    curEntries.forEach((e) => { if (e.method === 'cash') cashCount++; else cardCount++; });
    if (cardCount === 0 && cashCount === 0) return null;
    return cardCount >= cashCount
      ? { label: 'Card', icon: '💳', count: cardCount }
      : { label: 'Cash', icon: '💵', count: cashCount };
  }, [curEntries]);

  const { topExpenseDay, topIncomeDay } = useMemo(() => {
    const expenseByDay = {};
    const incomeByDay = {};
    curEntries.forEach((e) => {
      const k = dayKey(e.createdAt);
      if (e.type === 'expense') expenseByDay[k] = (expenseByDay[k] || 0) + e.amount;
      else incomeByDay[k] = (incomeByDay[k] || 0) + e.amount;
    });
    const bestExpenseKey = Object.keys(expenseByDay).sort((a, b) => expenseByDay[b] - expenseByDay[a])[0];
    const bestIncomeKey = Object.keys(incomeByDay).sort((a, b) => incomeByDay[b] - incomeByDay[a])[0];
    const fmtDay = (k) => k ? new Date(k).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' }) : null;
    return {
      topExpenseDay: bestExpenseKey ? { date: fmtDay(bestExpenseKey), amount: expenseByDay[bestExpenseKey] } : null,
      topIncomeDay: bestIncomeKey ? { date: fmtDay(bestIncomeKey), amount: incomeByDay[bestIncomeKey] } : null,
    };
  }, [curEntries]);

  const pieData = CATEGORIES.filter((c) => categoryTotals[c.id] > 0).map((c, i) => ({
    label: c.label,
    icon: c.icon,
    value: categoryTotals[c.id],
    color: PALETTE[CATEGORIES.indexOf(c) % PALETTE.length],
  }));

  const methodPieData = useMemo(() => ([
    { label: 'Card', icon: '💳', value: Math.abs(cardBalance), color: '#c99a3e' },
    { label: 'Cash', icon: '💵', value: Math.abs(cashBalance), color: '#3f8f5f' },
  ]), [cardBalance, cashBalance]);

  const monthlyComparison = useMemo(() => {
    return last6Months().map((m) => ({
      label: m.label,
      a: curEntries.filter((e) => e.type === 'income' && monthKey(e.createdAt) === m.key).reduce((s, e) => s + e.amount, 0),
      b: curEntries.filter((e) => e.type === 'expense' && monthKey(e.createdAt) === m.key).reduce((s, e) => s + e.amount, 0),
    }));
  }, [curEntries]);

  const balanceTrend = useMemo(() => {
    const days = last30Days();
    let cumulative = 0;
    return days.map((d) => {
      const dayEntries = curEntries.filter((e) => dayKey(e.createdAt) === d.key);
      const net = dayEntries.reduce((s, e) => s + (e.type === 'income' ? e.amount : -e.amount), 0);
      cumulative += net;
      return { label: d.label, value: cumulative };
    });
  }, [curEntries]);

  return (
    <div className="app-shell">
      <div className="brand-row">
        <div>
          <div className="brand">Statistici</div>
          <div className="brand-tag">Grafice & analiză</div>
        </div>
      </div>

      <CurrencySwitch currency={currency} onChange={setCurrency} marginBottom={16} />

      {/* Carduri sumar */}
      <div className="currency-fade" key={currency} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <div className="mini-stat-card stagger-card">
          <div className="mini-stat-label">Economii totale</div>
          <div className="mini-stat-value" style={{ color: totalSavings < 0 ? 'var(--red)' : 'var(--green)' }}>
            {fmt(totalSavings)} {curSuffix(currency)}
          </div>
        </div>
        <div className="mini-stat-card stagger-card">
          <div className="mini-stat-label">Medie zilnică</div>
          <div className="mini-stat-value">{fmt(dailyAvg)} {curSuffix(currency)}</div>
          <div className="mini-stat-sub">cheltuit, pe {daysTracked} zile</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div className="mini-stat-card stagger-card">
          <div className="mini-stat-label">🔻 Cea mai mare cheltuială</div>
          {biggestExpense ? (
            <>
              <div className="mini-stat-value" style={{ color: '#e08672', fontSize: 15 }}>
                {fmt(biggestExpense.amount)} {curSuffix(currency)}
              </div>
              <div className="mini-stat-sub" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{biggestExpense.desc}</div>
            </>
          ) : <div className="mini-stat-sub">—</div>}
        </div>
        <div className="mini-stat-card stagger-card">
          <div className="mini-stat-label">🔺 Cel mai mare venit</div>
          {biggestIncome ? (
            <>
              <div className="mini-stat-value" style={{ color: '#6fd196', fontSize: 15 }}>
                {fmt(biggestIncome.amount)} {curSuffix(currency)}
              </div>
              <div className="mini-stat-sub" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{biggestIncome.desc}</div>
            </>
          ) : <div className="mini-stat-sub">—</div>}
        </div>
      </div>

      {topCategory && (
        <div className="card stagger-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 26 }}>{topCategory.icon}</div>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(244,236,219,0.45)', textTransform: 'uppercase', letterSpacing: 1 }}>Categoria principală</div>
            <div style={{ fontWeight: 600 }}>{topCategory.label} — {fmt(categoryTotals[topCategoryId])} {curSuffix(currency)}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <div className="mini-stat-card stagger-card">
          <div className="mini-stat-label">📅 Ziua cu cele mai multe cheltuieli</div>
          {topExpenseDay ? (
            <>
              <div className="mini-stat-value" style={{ color: '#e08672', fontSize: 15 }}>{fmt(topExpenseDay.amount)} {curSuffix(currency)}</div>
              <div className="mini-stat-sub">{topExpenseDay.date}</div>
            </>
          ) : <div className="mini-stat-sub">—</div>}
        </div>
        <div className="mini-stat-card stagger-card">
          <div className="mini-stat-label">📅 Ziua cu cele mai multe venituri</div>
          {topIncomeDay ? (
            <>
              <div className="mini-stat-value" style={{ color: '#6fd196', fontSize: 15 }}>{fmt(topIncomeDay.amount)} {curSuffix(currency)}</div>
              <div className="mini-stat-sub">{topIncomeDay.date}</div>
            </>
          ) : <div className="mini-stat-sub">—</div>}
        </div>
      </div>

      {preferredMethod && (
        <div className="card stagger-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 26 }}>{preferredMethod.icon}</div>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(244,236,219,0.45)', textTransform: 'uppercase', letterSpacing: 1 }}>Metoda preferată</div>
            <div style={{ fontWeight: 600 }}>{preferredMethod.label} — {preferredMethod.count} tranzacții</div>
          </div>
        </div>
      )}

      {/* Distribuția banilor: Card vs Cash */}
      <div style={{ fontSize: 11, color: 'rgba(244,236,219,0.45)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, margin: '18px 0 10px' }}>
        💳 Distribuția banilor
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <div className="mini-stat-card stagger-card">
          <div className="mini-stat-label">💳 Card</div>
          <div className="mini-stat-value" style={{ color: '#c99a3e' }}>{fmt(cardBalance)} {curSuffix(currency)}</div>
          <div className="mini-stat-sub">{cardPct}%</div>
        </div>
        <div className="mini-stat-card stagger-card">
          <div className="mini-stat-label">💵 Cash</div>
          <div className="mini-stat-value" style={{ color: '#3f8f5f' }}>{fmt(cashBalance)} {curSuffix(currency)}</div>
          <div className="mini-stat-sub">{cashPct}%</div>
        </div>
      </div>
      <div className="card stagger-card">
        <div className="chart-title-row">Card vs Cash</div>
        <PieChart data={methodPieData} />
      </div>

      <div className="card stagger-card">
        <div className="chart-title-row">Cheltuieli pe categorii</div>
        <PieChart data={pieData} />
      </div>

      <div className="card stagger-card">
        <div className="chart-title-row">
          Comparație lunară — ultimele 6 luni
          <span style={legendStyle}>
            <LegendDot color="#3f8f5f" label="Venit" />
            <LegendDot color="#b0503f" label="Cheltuială" />
          </span>
        </div>
        <BarChart months={monthlyComparison} colorA="#3f8f5f" colorB="#b0503f" />
      </div>

      <div className="card stagger-card">
        <div className="chart-title-row">Trend sold — ultimele 30 zile</div>
        <LineChart points={balanceTrend} color="#c99a3e" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      {label}
    </span>
  );
}

const legendStyle = { display: 'flex', gap: 14, marginLeft: 'auto', fontSize: 10, textTransform: 'none', letterSpacing: 0, fontWeight: 400 };
