import { lazy, Suspense } from 'react';
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

const Stats = lazy(() => import('./pages/Stats'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Spaces = lazy(() => import('./pages/Spaces'));
const SpaceDetail = lazy(() => import('./pages/SpaceDetail'));
const Goals = lazy(() => import('./pages/Goals'));
const GoalDetail = lazy(() => import('./pages/GoalDetail'));
const Settings = lazy(() => import('./pages/Settings'));

function RouteFallback() {
  return <div className="app-shell" />;
}

function Shell({ children }) {
  const location = useLocation();
  const hideNav = location.pathname === '/login';
  return (
    <div className="app-frame">
      <div className="app-scroll">
        {/* key={pathname} forțează un remount la schimbarea rutei, ceea ce declanșează
            animația .page-transition definită în theme.css — o tranziție fade+slide
            discretă, fără librării de routing-animation externe. */}
        <div className="page-transition" key={location.pathname}>
          {children}
        </div>
      </div>
      {!hideNav && <BottomNav />}
      <div id="app-overlay-root" className="app-overlay"></div>
    </div>
  );
}

/** Afișează ecranul de blocare (PIN) doar dacă userul e logat ȘI are un PIN setat ȘI e blocat momentan. */
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
                    <Suspense fallback={<RouteFallback />}>
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
                    </Suspense>
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
