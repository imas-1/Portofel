# Portofel

Aplicație React de gestiune personală a banilor (venituri/cheltuieli, spații, obiective de economisire), cu Firebase ca backend și instalabilă ca PWA pe telefon.

## Setup local

```bash
npm install
npm run dev
```

## Deploy

Codul e conectat la Vercel (vezi `portofel-two.vercel.app` sau domeniul curent). Deploy se face automat la fiecare push pe branch-ul principal din GitHub — nu e nevoie de pași suplimentari pe partea de server.

```bash
git add .
git commit -m "descriere schimbare"
git push
```

Vercel preia automat modificarea și publică noua versiune în câteva minute.

## ⚠️ După fiecare deploy: reinstalează PWA-ul pe telefon

Asta e pasul care se uită cel mai des și cauzează confuzie de tipul "am făcut deploy dar tot văd varianta veche".

**De ce:** odată instalată pe ecranul principal (Add to Home Screen), aplicația funcționează ca PWA — adică are un Service Worker care cache-uiește fișierele local, ca să meargă și offline. Acest cache nu se resincronizează mereu automat imediat după un deploy nou; shortcut-ul deja instalat poate continua să arate codul vechi o vreme.

**Pași, de fiecare dată când faci o schimbare de UI/comportament:**

1. Fă deploy normal (push pe GitHub → Vercel publică automat)
2. Pe telefon: șterge aplicația de pe ecranul principal (apasă lung pe iconiță → Remove/Delete)
3. Deschide adresa site-ului din Safari
4. Share → **Add to Home Screen** (o reinstalezi de la zero)

## Cum verifici că telefonul chiar rulează ultima versiune

Deschide aplicația → **Setări** → jos de tot vei vedea ceva de genul:

```
Portofel v1.1.0 · build 22.07, 19:30
```

- **Versiunea** (`v1.1.0`) vine din `package.json` — o crești manual cu fiecare schimbare notabilă (vezi mai jos)
- **Build**-ul e data/ora exactă la care s-a compilat codul — se actualizează *automat*, fără să faci nimic, la fiecare `npm run build`

Dacă ora de build arată o dată/oră veche (de dinainte de ultimul tău deploy), înseamnă că telefonul încă rulează varianta cache-uită — repetă pașii de reinstalare de mai sus.

### Cum crești versiunea

În `package.json`, câmpul `"version"`:

```json
"version": "1.1.0"
```

Crește-l manual când faci o schimbare notabilă (ex. `1.1.0` → `1.2.0` pentru un feature nou, `1.1.0` → `1.1.1` pentru un fix mic). Nu e obligatoriu tehnic, dar te ajută să identifici rapid din Setări ce versiune rulează telefonul, mai ales dacă ceri ajutor la un bug și trebuie să confirmi ce cod ai instalat de fapt.

## Testare automată

```bash
npm run test
```

Rulează teste Playwright (`tests/layout.spec.js`) care verifică automat, fără telefon:
- bara de jos nu are gol vizibil dedesubt
- swipe-ul pe tranzacții chiar mișcă rândul

Necesită `npm install` făcut o dată în prealabil. Playwright pornește singur serverul de dev pentru teste (vezi `playwright.config.js`).

## Structură pe scurt

- `src/pages/` — ecranele principale (Dashboard, Statistici, Calendar, Spații, Obiective, Setări)
- `src/components/` — componente reutilizabile (formulare, grafice, swipe-rows etc.)
- `src/context/` — Firebase/date, autentificare, temă, securitate (PIN), snackbar
- `src/utils/` — funcții pure (formatare, calcule, export)
- `src/styles/theme.css` — toată tema vizuală (verde închis + crem + auriu) — un singur fișier, ca să fie ușor de păstrat consistentă
