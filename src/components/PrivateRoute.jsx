import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(244,236,219,0.5)' }}>
        <span className="spinner" />
        Se încarcă...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
