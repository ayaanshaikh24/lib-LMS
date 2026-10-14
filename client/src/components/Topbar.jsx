import React from 'react';
import { Menu, LogOut, ShieldCheck, UserCheck, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Topbar = ({ toggleMobile, title }) => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={13} /> Administrator
          </span>
        );
      case 'librarian':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <BookOpen size={13} /> Librarian
          </span>
        );
      default:
        return (
          <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <UserCheck size={13} /> Student ({user?.studentId || 'Portal'})
          </span>
        );
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-toggle" onClick={toggleMobile} aria-label="Toggle menu">
          <Menu size={22} />
        </button>
        <h2 className="breadcrumb-title">{title}</h2>
      </div>

      <div className="topbar-right">
        {user && getRoleBadge(user.role)}
        <button
          onClick={logout}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
