import { useMemo, useState } from 'react';

const DEFAULT_FILTERS = {
  search: '',
  category: 'all',
  period: 'all',
  spaceId: 'all',
  minAmount: '',
  maxAmount: '',
  type: 'all',
};

function periodStartDate(period) {
  const now = new Date();
  if (period === '7d') return now.getTime() - 7 * 86400000;
  if (period === '30d') return now.getTime() - 30 * 86400000;
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  if (period === 'year') return new Date(now.getFullYear(), 0, 1).getTime();
  return null;
}

export default function useTransactionFilters(entries) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  function setFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function reset() {
    setFilters(DEFAULT_FILTERS);
  }

  const filtered = useMemo(() => {
    const periodStart = periodStartDate(filters.period);
    const min = filters.minAmount !== '' ? parseFloat(String(filters.minAmount).replace(',', '.')) : null;
    const max = filters.maxAmount !== '' ? parseFloat(String(filters.maxAmount).replace(',', '.')) : null;
    const searchLower = filters.search.trim().toLowerCase();

    return entries.filter((e) => {
      if (searchLower && !(e.desc || '').toLowerCase().includes(searchLower)) return false;
      if (filters.category !== 'all' && (e.category || 'altele') !== filters.category) return false;
      if (filters.type !== 'all' && e.type !== filters.type) return false;
      if (filters.spaceId === 'none' && e.spaceId) return false;
      if (filters.spaceId !== 'all' && filters.spaceId !== 'none' && e.spaceId !== filters.spaceId) return false;
      if (periodStart !== null && e.createdAt < periodStart) return false;
      if (min !== null && !isNaN(min) && e.amount < min) return false;
      if (max !== null && !isNaN(max) && e.amount > max) return false;
      return true;
    });
  }, [entries, filters]);

  const activeCount = useMemo(() => {
    let n = 0;
    if (filters.search) n++;
    if (filters.category !== 'all') n++;
    if (filters.period !== 'all') n++;
    if (filters.spaceId !== 'all') n++;
    if (filters.minAmount !== '') n++;
    if (filters.maxAmount !== '') n++;
    if (filters.type !== 'all') n++;
    return n;
  }, [filters]);

  return { filters, setFilter, reset, filtered, activeCount };
}
