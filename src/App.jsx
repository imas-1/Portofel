import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { SnackbarProvider } from './context/SnackbarContext';
import { ThemeProvider } from './context/ThemeContext';
import { SecurityProvider, useSecurity } from './context/SecurityContext';
import PrivateRoute from './components/PrivateRoute';
import BottomNav from './components/BottomNav';
import UpdatePrompt from './components/UpdatePrompt';
import LockScreen from './components/LockScreen';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Stats from './pages/Stats';
import Calendar from './pages/Calendar';
import Spaces from './pages/Spaces';
import SpaceDetail from './pages/SpaceDetail';
import Goals from './pages/Goals';
import GoalDetail from './pages/GoalDetail';
import Settings from './pages/Settings';

function Shell({ children }) {
  const location = useLocation();
  const hideNav = location.pathname === '/login';
  return (
    <>
      {/* key={pathname} forțează un remount la schimbarea rutei, ceea ce declanșează
          animația .page-transition definită în theme.css — o tranziție fade+slide
          discretă, fără librării de routing-animation externe. */}
      <div className="page-transition" key={location.pathname}>
        {children}
      </div>
      {!hideNav && <BottomNav />}
    </>
  );
}

/** Afișează ecranul de blocare (PIN/Face ID) doar dacă userul e logat ȘI are un PIN setat ȘI e blocat momentan. */
function LockGate({ children }) {
  const { user } = useAuth();
  const { hasPin, locked } = useSecurity();
  if (user && hasPin && locked) return <LockScreen />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <SecurityProvider>
              <SnackbarProvider>
                <UpdatePrompt />
                <LockGate>
                  <Shell>
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                      <Route path="/statistici" element={<PrivateRoute><Stats /></PrivateRoute>} />
                      <Route path="/calendar" element={<PrivateRoute><Calendar /></PrivateRoute>} />
                      <Route path="/spatii" element={<PrivateRoute><Spaces /></PrivateRoute>} />
                      <Route path="/spatii/:spaceId" element={<PrivateRoute><SpaceDetail /></PrivateRoute>} />
                      <Route path="/obiective" element={<PrivateRoute><Goals /></PrivateRoute>} />
                      <Route path="/obiective/:goalId" element={<PrivateRoute><GoalDetail /></PrivateRoute>} />
                      <Route path="/setari" element={<PrivateRoute><Settings /></PrivateRoute>} />
                    </Routes>
                  </Shell>
                </LockGate>
              </SnackbarProvider>
            </SecurityProvider>
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
