import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ref, push, remove, update, onValue } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export const CATEGORIES = [
  { id: 'salariu', label: 'Salariu', icon: '💼' },
  { id: 'mancare', label: 'Mâncare', icon: '🍔' },
  { id: 'transport', label: 'Transport', icon: '🚗' },
  { id: 'facturi', label: 'Facturi', icon: '💡' },
  { id: 'chirie', label: 'Chirie', icon: '🏠' },
  { id: 'sanatate', label: 'Sănătate', icon: '💊' },
  { id: 'distractie', label: 'Distracție', icon: '🎮' },
  { id: 'cumparaturi', label: 'Cumpărături', icon: '🛍️' },
  { id: 'cadouri', label: 'Cadouri', icon: '🎁' },
  { id: 'altele', label: 'Altele', icon: '📦' },
];
export const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export const CURRENCIES = [
  { id: 'RON', label: 'Lei', suffix: 'lei' },
  { id: 'EUR', label: 'Euro', suffix: '€' },
];
export function curSuffix(cur) {
  return (CURRENCIES.find((c) => c.id === cur) || CURRENCIES[0]).suffix;
}

const MAX_HARD_AMOUNT = 10000000;

export function computeSpaceStats(entries, spaceId, currency = 'RON') {
  const spaceEntries = entries.filter((e) => e.spaceId === spaceId && (e.currency || 'RON') === currency);
  const spent = spaceEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const income = spaceEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const lastUpdated = spaceEntries.reduce((max, e) => Math.max(max, e.createdAt || 0), 0);
  return { spent, income, count: spaceEntries.length, lastUpdated };
}

export function computeGoalStats(goal) {
  const current = (goal.contributions || []).reduce((s, c) => s + c.amount, 0);
  const target = goal.targetAmount || 0;
  const remaining = Math.max(0, target - current);
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  let estimateLabel = 'Adaugă câteva contribuții pentru o estimare';
  const contribs = [...(goal.contributions || [])].sort((a, b) => a.createdAt - b.createdAt);
  if (contribs.length >= 2 && remaining > 0) {
    const first = contribs[0].createdAt;
    const last = contribs[contribs.length - 1].createdAt;
    const weeksElapsed = Math.max(1, (last - first) / (7 * 86400000));
    const avgPerWeek = current / weeksElapsed;
    if (avgPerWeek > 0) {
      const weeksLeft = Math.ceil(remaining / avgPerWeek);
      const estDate = new Date(Date.now() + weeksLeft * 7 * 86400000);
      estimateLabel = `Estimat: ${estDate.toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })} (~${weeksLeft} săpt.)`;
    }
  } else if (remaining === 0) {
    estimateLabel = 'Obiectiv atins! 🎉';
  }

  return { current, target, remaining, pct, estimateLabel };
}

export function relativeTime(ts) {
  if (!ts) return 'fără tranzacții';
  const diff = Date.now() - ts;
  const day = 86400000;
  if (diff < 3600000) return 'acum ' + Math.max(1, Math.round(diff / 60000)) + ' min';
  if (diff < day) return 'acum ' + Math.round(diff / 3600000) + ' h';
  if (diff < day * 2) return 'ieri';
  if (diff < day * 30) return 'acum ' + Math.round(diff / day) + ' zile';
  return new Date(ts).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' });
}

function normalizeAmount(raw) {
  let amount = parseFloat(raw);
  if (!isFinite(amount)) return null;
  return Math.round(amount * 100) / 100;
}

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setSpaces([]);
      setGoals([]);
      setLoaded(false);
      return;
    }
    const entriesRef = ref(db, `users/${user.uid}/entries`);
    const unsubEntries = onValue(entriesRef, (snap) => {
      const data = snap.val() || {};
      setEntries(Object.keys(data).map((key) => ({ id: key, ...data[key] })));
      setLoaded(true);
    });

    const spacesRef = ref(db, `users/${user.uid}/spaces`);
    const unsubSpaces = onValue(spacesRef, (snap) => {
      const data = snap.val() || {};
      setSpaces(
        Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .sort((a, b) => b.createdAt - a.createdAt)
      );
    });

    const goalsRef = ref(db, `users/${user.uid}/goals`);
    const unsubGoals = onValue(goalsRef, (snap) => {
      const data = snap.val() || {};
      setGoals(
        Object.keys(data).map((key) => {
          const g = data[key];
          const contributions = g.contributions
            ? Object.keys(g.contributions).map((ck) => ({ id: ck, ...g.contributions[ck] }))
            : [];
          return { id: key, ...g, contributions };
        }).sort((a, b) => b.createdAt - a.createdAt)
      );
    });

    return () => {
      unsubEntries();
      unsubSpaces();
      unsubGoals();
    };
  }, [user]);

  async function addEntry({ type, amount, category, method, currency, desc, spaceId, createdAt }) {
    const norm = normalizeAmount(amount);
    if (!norm || norm <= 0 || norm > MAX_HARD_AMOUNT) throw new Error('Sumă invalidă');
    const entriesRef = ref(db, `users/${user.uid}/entries`);
    const payload = {
      type,
      amount: norm,
      category: category || 'altele',
      method: method || 'card',
      currency: currency || 'RON',
      desc: (desc || (type === 'income' ? 'Bani primiți' : 'Cheltuială')).slice(0, 80),
      createdAt: createdAt || Date.now(),
    };
    if (spaceId) payload.spaceId = spaceId;
    return push(entriesRef, payload);
  }

  async function editEntry(id, fields) {
    const patch = { ...fields };
    if (patch.amount !== undefined) {
      const norm = normalizeAmount(patch.amount);
      if (!norm || norm <= 0 || norm > MAX_HARD_AMOUNT) throw new Error('Sumă invalidă');
      patch.amount = norm;
    }
    return update(ref(db, `users/${user.uid}/entries/${id}`), patch);
  }

  async function deleteEntry(id) {
    return remove(ref(db, `users/${user.uid}/entries/${id}`));
  }

  async function restoreEntry(data) {
    const { id, ...rest } = data;
    return push(ref(db, `users/${user.uid}/entries`), rest);
  }

  async function createSpace(space) {
    return push(ref(db, `users/${user.uid}/spaces`), { ...space, archived: false, createdAt: Date.now() });
  }
  async function updateSpace(id, fields) {
    return update(ref(db, `users/${user.uid}/spaces/${id}`), fields);
  }
  async function duplicateSpace(id) {
    const original = spaces.find((s) => s.id === id);
    if (!original) throw new Error('Spațiul nu a fost găsit');
    const { id: _omit, createdAt: _c, ...rest } = original;
    return push(ref(db, `users/${user.uid}/spaces`), {
      ...rest,
      name: `${original.name} (copie)`,
      archived: false,
      createdAt: Date.now(),
    });
  }
  async function deleteSpace(id) {
    const updates = {};
    entries.filter((e) => e.spaceId === id).forEach((e) => {
      updates[`users/${user.uid}/entries/${e.id}/spaceId`] = null;
    });
    updates[`users/${user.uid}/spaces/${id}`] = null;
    return update(ref(db), updates);
  }

  async function createGoal(goal) {
    return push(ref(db, `users/${user.uid}/goals`), { ...goal, completed: false, createdAt: Date.now() });
  }
  async function updateGoal(id, fields) {
    return update(ref(db, `users/${user.uid}/goals/${id}`), fields);
  }
  async function deleteGoal(id) {
    return remove(ref(db, `users/${user.uid}/goals/${id}`));
  }
  async function addContribution(goalId, { amount, note, createdAt }) {
    const norm = normalizeAmount(amount);
    if (!norm || norm <= 0) throw new Error('Sumă invalidă');
    const contribRef = ref(db, `users/${user.uid}/goals/${goalId}/contributions`);
    await push(contribRef, { amount: norm, note: note || '', createdAt: createdAt || Date.now() });

    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      const newTotal = goal.contributions.reduce((s, c) => s + c.amount, 0) + norm;
      if (newTotal >= goal.targetAmount && !goal.completed) {
        await update(ref(db, `users/${user.uid}/goals/${goalId}`), { completed: true, completedAt: Date.now() });
      }
    }
  }
  async function deleteContribution(goalId, contribId) {
    return remove(ref(db, `users/${user.uid}/goals/${goalId}/contributions/${contribId}`));
  }

  const value = useMemo(
    () => ({
      entries, spaces, goals, loaded,
      addEntry, editEntry, deleteEntry, restoreEntry,
      createSpace, updateSpace, duplicateSpace, deleteSpace,
      createGoal, updateGoal, deleteGoal, addContribution, deleteContribution,
    }),
    [entries, spaces, goals, loaded]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
