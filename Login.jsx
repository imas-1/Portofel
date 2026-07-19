import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function friendlyError(code) {
  const map = {
    'auth/invalid-email': 'Email invalid.',
    'auth/user-not-found': 'Nu există cont cu acest email.',
    'auth/wrong-password': 'Parolă greșită.',
    'auth/invalid-credential': 'Email sau parolă greșită.',
    'auth/email-already-in-use': 'Există deja un cont cu acest email.',
    'auth/weak-password': 'Parola trebuie să aibă minim 6 caractere.',
    'auth/missing-email': 'Completează email-ul mai întâi.',
  };
  return map[code] || 'A apărut o eroare. Încearcă din nou.';
}

export default function Login() {
  const { user, login, signup, resetPassword } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email || !password) {
      setError('Completează email și parolă.');
      return;
    }
    setBusy(true);
    try {
      if (isSignup) await signup(email, password);
      else await login(email, password);
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot() {
    setError('');
    setSuccess('');
    if (!email) {
      setError('Scrie-ți email-ul mai sus, apoi apasă din nou.');
      return;
    }
    try {
      await resetPassword(email);
      setSuccess('Ți-am trimis un email de resetare a parolei.');
    } catch (err) {
      setError(friendlyError(err.code));
    }
  }

  return (
    <div className="app-shell" style={{ display: 'flex', alignItems: 'center', minHeight: '100vh' }}>
      <div
        style={{
          width: '100%',
          background: 'var(--paper)',
          color: 'var(--ink)',
          borderRadius: 22,
          padding: '34px 26px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
        }}
      >
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 600, textAlign: 'center' }}>
          Portofel
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', textAlign: 'center', margin: '4px 0 22px' }}>
          {isSignup ? 'Creează un cont nou' : 'Intră în cont'}
        </div>

        {error && <div className="error-msg" style={{ textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ color: 'var(--green)', fontSize: 13, textAlign: 'center', marginBottom: 10 }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@exemplu.com"
            style={inputStyle}
          />
          <label style={labelStyle}>Parolă</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="minim 6 caractere"
            style={inputStyle}
          />
          <button type="submit" className="btn-primary" disabled={busy} style={{ background: 'var(--ink)', color: 'var(--paper)' }}>
            {busy ? <span className="spinner" /> : null}
            {isSignup ? 'Creează cont' : 'Intră în cont'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--ink-soft)' }}>
          {isSignup ? 'Ai deja cont? ' : 'Nu ai cont? '}
          <a onClick={() => setIsSignup(!isSignup)} style={{ color: 'var(--green)', fontWeight: 600, cursor: 'pointer' }}>
            {isSignup ? 'Intră aici' : 'Creează unul'}
          </a>
        </div>
        <div style={{ textAlign: 'center', marginTop: 6 }}>
          <a onClick={handleForgot} style={{ fontSize: 12, color: 'var(--ink-soft)', textDecoration: 'underline', cursor: 'pointer' }}>
            Ai uitat parola?
          </a>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--ink-soft)', marginBottom: 6, display: 'block', fontWeight: 600 };
const inputStyle = { background: '#fffdf7', color: 'var(--ink)', border: '1.5px solid #d9cba6' };
