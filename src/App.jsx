import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { SnackbarProvider } from './context/SnackbarContext';
import PrivateRoute from './components/PrivateRoute';
import BottomNav from './components/BottomNav';
import UpdatePrompt from './components/UpdatePrompt';
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <SnackbarProvider>
            <UpdatePrompt />
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
          </SnackbarProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
