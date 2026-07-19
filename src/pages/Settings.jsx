import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { logout, user } = useAuth();

  return (
    <div className="app-shell">
      <div className="brand-row">
        <div>
          <div className="brand">Setări</div>
          <div className="brand-tag">{user?.email}</div>
        </div>
      </div>

      <button className="btn-primary" style={{ background: 'var(--red)', color: '#fff' }} onClick={logout}>
        Ieși din cont
      </button>

      <div className="card" style={{ marginTop: 16, textAlign: 'center', color: 'rgba(244,236,219,0.4)', fontSize: 13 }}>
        Face ID / PIN, Dark/Light mode, Export PDF/CSV și Backup vin la Funcționalitatea 8 din listă.
      </div>
    </div>
  );
}
