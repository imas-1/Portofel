import { createContext, useContext, useEffect, useState } from 'react';

const SecurityContext = createContext(null);

async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function SecurityProvider({ children }) {
  const [pinHash, setPinHash] = useState(() => localStorage.getItem('portofel_pin_hash'));
  const [biometricEnabled, setBiometricEnabled] = useState(() => localStorage.getItem('portofel_biometric') === '1');
  const [locked, setLocked] = useState(!!localStorage.getItem('portofel_pin_hash'));

  // Re-blochează aplicația când revine din fundal (ex. utilizatorul a schimbat aplicația și s-a întors)
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === 'visible' && pinHash) {
        setLocked(true);
      }
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [pinHash]);

  async function setPin(pin) {
    const hash = await sha256(pin);
    localStorage.setItem('portofel_pin_hash', hash);
    setPinHash(hash);
    setLocked(false);
  }

  function removePin() {
    localStorage.removeItem('portofel_pin_hash');
    localStorage.removeItem('portofel_biometric');
    setPinHash(null);
    setBiometricEnabled(false);
    setLocked(false);
  }

  async function verifyPin(pin) {
    const hash = await sha256(pin);
    if (hash === pinHash) {
      setLocked(false);
      return true;
    }
    return false;
  }

  function toggleBiometric(value) {
    localStorage.setItem('portofel_biometric', value ? '1' : '0');
    setBiometricEnabled(value);
  }

  /**
   * Deblocare biometrică (Face ID / amprentă) prin WebAuthn — folosește
   * autentificatorul platformei dacă e disponibil. Notă: acest API necesită
   * HTTPS și o interacțiune reală a utilizatorului; nu am putut testa efectiv
   * fluxul pe un dispozitiv real în acest mediu, deci tratează-l ca "beta" —
   * dacă WebAuthn eșuează sau nu e suportat, se poate oricând debloca prin PIN.
   */
  async function unlockWithBiometrics() {
    if (!window.PublicKeyCredential) return false;
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) return false;
      await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          userVerification: 'required',
          timeout: 30000,
        },
      });
      setLocked(false);
      return true;
    } catch (e) {
      return false;
    }
  }

  const hasPin = !!pinHash;

  return (
    <SecurityContext.Provider
      value={{ hasPin, locked, biometricEnabled, setPin, removePin, verifyPin, toggleBiometric, unlockWithBiometrics, setLocked }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const ctx = useContext(SecurityContext);
  if (!ctx) throw new Error('useSecurity must be used within SecurityProvider');
  return ctx;
}
