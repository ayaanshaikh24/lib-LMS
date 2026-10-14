import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BooksPage from './pages/BooksPage';
import StudentsPage from './pages/StudentsPage';
import IssuesPage from './pages/IssuesPage';
import FinesPage from './pages/FinesPage';
import ReportsPage from './pages/ReportsPage';
import MyBooksPage from './pages/MyBooksPage';

/**
 * Route protection guard checking authentication & role requirements
 */
const ProtectedLayout = ({ children, requiredRole }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Initializing Nexora session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (requiredRole === 'manage' && user.role !== 'admin' && user.role !== 'librarian') {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole === 'student' && user.role !== 'student') {
    return <Navigate to="/dashboard" replace />;
  }

  // Map route to topbar title
  const getPageTitle = (path) => {
    if (path.includes('/books')) return 'Library Catalog';
    if (path.includes('/students')) return 'Student Management';
    if (path.includes('/issues')) return 'Circulation: Issue & Return Desk';
    if (path.includes('/fines')) return 'Fines & Penalties Ledger';
    if (path.includes('/reports')) return 'Audit & Circulation Reports';
    if (path.includes('/my-books')) return 'My Borrowed Books';
    return 'Nexora Library Dashboard';
  };

  return (
    <div className="app-layout">
      <Sidebar mobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)} />
      <div className="main-viewport">
        <Topbar toggleMobile={() => setMobileOpen(!mobileOpen)} title={getPageTitle(location.pathname)} />
        <main className="content-area">{children}</main>
      </div>
    </div>
  );
};

// Redirect logged-in users away from /login
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedLayout>
                <DashboardPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/books"
            element={
              <ProtectedLayout>
                <BooksPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/students"
            element={
              <ProtectedLayout requiredRole="manage">
                <StudentsPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/issues"
            element={
              <ProtectedLayout requiredRole="manage">
                <IssuesPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/fines"
            element={
              <ProtectedLayout requiredRole="manage">
                <FinesPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedLayout requiredRole="manage">
                <ReportsPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/my-books"
            element={
              <ProtectedLayout requiredRole="student">
                <MyBooksPage />
              </ProtectedLayout>
            }
          />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
