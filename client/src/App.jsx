import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Entry from './pages/Entry';
import History from './pages/History';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import Backup from './pages/Backup';
import Settings from './pages/Settings';
import Categories from './pages/Categories';
import MenuManagement from './pages/MenuManagement';
import POSEntry from './pages/POSEntry';
import POSHistory from './pages/POSHistory';
import Reports from './pages/Reports';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-card text-center">
          <div className="login-logo">💰</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route (redirect if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-card text-center">
          <div className="login-logo">💰</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="entry" element={<Entry />} />
              <Route path="history" element={<History />} />
              <Route path="categories" element={<Categories />} />
              <Route path="menu" element={<MenuManagement />} />
              <Route path="pos" element={<POSEntry />} />
              <Route path="sales-record" element={<POSEntry />} />
              <Route path="pos/history" element={<POSHistory />} />
              <Route path="report" element={<Reports />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route
                path="users"
                element={
                  <ProtectedRoute adminOnly>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="backup"
                element={
                  <ProtectedRoute adminOnly>
                    <Backup />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
