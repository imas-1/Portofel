import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import PrivateRoute from './components/PrivateRoute';
import BottomNav from './components/BottomNav';
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
      {children}
      {!hideNav && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
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
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
