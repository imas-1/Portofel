import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Folosește hook-ul oficial al vite-plugin-pwa pentru React.
 * Fluxul:
 * 1. Service Worker-ul nou e detectat în fundal (Workbox verifică periodic + la fiecare navigare)
 * 2. `needRefresh` devine true când există un SW nou în așteptare
 * 3. Afișăm bannerul — utilizatorul alege când să actualizeze (nu-l forțăm în mijlocul unei acțiuni)
 * 4. La apăsare, `updateServiceWorker(true)` activează noul SW (skipWaiting) și reîncarcă pagina
 */
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      // Verifică periodic dacă a apărut o versiune nouă pe server — util pentru
      // cazul în care aplicația rămâne deschisă multă vreme fără reload.
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60 * 60 * 1000); // la fiecare oră
    },
    onRegisterError(error) {
      console.error('Eroare la înregistrarea Service Worker-ului:', error);
    },
  });

  function close() {
    setNeedRefresh(false);
    setOfflineReady(false);
  }

  async function handleUpdate() {
    await updateServiceWorker(true);
  }

  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="update-banner">
      <span className="update-banner-text">
        {needRefresh ? 'Este disponibilă o versiune nouă.' : 'Aplicația e gata și pentru offline.'}
      </span>
      <div className="update-banner-actions">
        {needRefresh && (
          <button onClick={handleUpdate} className="update-banner-btn">Actualizează acum</button>
        )}
        <button onClick={close} className="update-banner-dismiss" aria-label="Închide">✕</button>
      </div>
    </div>
  );
}
