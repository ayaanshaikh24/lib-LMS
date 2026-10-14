import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Repeat,
  DollarSign,
  FileBarChart,
  BookMarked,
  LogOut,
  GraduationCap
} from 'lucide-react';

const Sidebar = ({ mobileOpen, closeMobile }) => {
  const { user, logout, canManage, isStudent } = useAuth();

  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand-icon">
          <GraduationCap size={22} />
        </div>
        <div className="sidebar-brand-text">
          <h1>Nexora</h1>
          <p>Library System</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Navigation</div>

        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={closeMobile}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/books"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={closeMobile}
        >
          <BookOpen size={18} />
          <span>Book Catalog</span>
        </NavLink>

        {canManage && (
          <>
            <NavLink
              to="/students"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeMobile}
            >
              <Users size={18} />
              <span>Students</span>
            </NavLink>

            <NavLink
              to="/issues"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeMobile}
            >
              <Repeat size={18} />
              <span>Issue & Return</span>
            </NavLink>

            <NavLink
              to="/fines"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeMobile}
            >
              <DollarSign size={18} />
              <span>Fines Ledger</span>
            </NavLink>

            <NavLink
              to="/reports"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeMobile}
            >
              <FileBarChart size={18} />
              <span>Reports</span>
            </NavLink>
          </>
        )}

        {isStudent && (
          <NavLink
            to="/my-books"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={closeMobile}
          >
            <BookMarked size={18} />
            <span>My Borrowed Books</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-badge">
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.name}</div>
            <span className="user-role-tag">{user?.role}</span>
          </div>
          <button
            onClick={logout}
            className="btn btn-outline btn-sm"
            style={{ color: '#ef4444', border: 'none', padding: '6px' }}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
