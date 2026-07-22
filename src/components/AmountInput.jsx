import { forwardRef } from 'react';

/**
 * Input dedicat pentru sume de bani.
 * - inputMode="decimal" -> tastatură numerică pe iOS și Android, fără litere
 * - type="text" (nu "number") -> control total asupra caracterelor permise,
 *   evită comportamente inconsistente ale <input type=number> pe diverse browsere mobile
 * - filtrează orice caracter în afară de cifre și UN singur separator zecimal (, sau .)
 * - valoarea internă rămâne mereu cu punct zecimal (standard JS), doar afișarea acceptă virgulă
 */
const AmountInput = forwardRef(function AmountInput({ value, onChange, placeholder, style, autoFocus, id }, ref) {
  function handleChange(e) {
    let raw = e.target.value;
    // înlocuim virgula cu punct pentru procesare internă, dar păstrăm ce a scris userul pentru afișare
    let cleaned = raw.replace(/[^0-9.,]/g, '');
    // permite un singur separator zecimal (fie , fie .)
    const firstSepIndex = cleaned.search(/[.,]/);
    if (firstSepIndex !== -1) {
      const before = cleaned.slice(0, firstSepIndex + 1);
      const after = cleaned.slice(firstSepIndex + 1).replace(/[.,]/g, '');
      cleaned = before + after;
    }
    // limitează la 2 zecimale în afișare
    const sepMatch = cleaned.match(/[.,](\d*)/);
    if (sepMatch && sepMatch[1].length > 2) {
      cleaned = cleaned.slice(0, cleaned.indexOf(sepMatch[0]) + 3);
    }
    // limitează partea întreagă la 9 cifre (max ~999.999.999) — evită sume introduse din greșeală
    const intPart = cleaned.split(/[.,]/)[0];
    if (intPart.length > 9) {
      const sep = cleaned.match(/[.,]/);
      const rest = sep ? cleaned.slice(cleaned.indexOf(sep[0])) : '';
      cleaned = intPart.slice(0, 9) + rest;
    }
    onChange(cleaned);
  }

  return (
    <input
      ref={ref}
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      autoFocus={autoFocus}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      style={style}
    />
  );
});

export default AmountInput;

/** Convertește textul introdus (cu , sau .) într-un număr JS valid, sau null dacă e invalid. */
export function parseAmountInput(raw) {
  if (raw == null || raw === '') return null;
  const normalized = String(raw).replace(',', '.');
  const val = parseFloat(normalized);
  if (!isFinite(val) || val > 999999999.99) return null;
  return Math.round(val * 100) / 100;
}
