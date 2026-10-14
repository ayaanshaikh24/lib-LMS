import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, BookOpen, User } from 'lucide-react';
import NexoraLogo from '../components/NexoraLogo';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = async (roleEmail, rolePassword) => {
    setEmail(roleEmail);
    setPassword(rolePassword);
    setError('');
    setLoading(true);
    try {
      await login(roleEmail, rolePassword);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-brand-header">
          <div style={{ display: 'inline-flex', marginBottom: '14px', filter: 'drop-shadow(0 8px 16px rgba(11, 16, 38, 0.35))' }}>
            <NexoraLogo size={56} />
          </div>
          <h2 className="login-brand-title">Nexora Library Portal</h2>
          <p className="login-brand-subtitle">
            Sign in to access circulation, books catalog, and academic records
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'var(--danger-light)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--danger-text)',
              fontSize: '13.5px',
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Institutional Email
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail
                size={18}
                style={{ position: 'absolute', left: '12px', color: 'var(--text-light)', pointerEvents: 'none' }}
              />
              <input
                id="login-email"
                type="email"
                className="form-control"
                style={{ paddingLeft: '38px', width: '100%' }}
                placeholder="name@collegelms.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock
                size={18}
                style={{ position: 'absolute', left: '12px', color: 'var(--text-light)', pointerEvents: 'none' }}
              />
              <input
                id="login-password"
                type="password"
                className="form-control"
                style={{ paddingLeft: '38px', width: '100%' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: '8px', padding: '11px', width: '100%' }}
            disabled={loading}
          >
            {loading ? (
              'Authenticating...'
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="demo-account-pills">
          <div className="demo-account-header">Quick Demo Login</div>
          <div className="demo-buttons-grid">
            <button
              type="button"
              className="demo-chip-btn"
              onClick={() => handleQuickFill('admin@collegelms.edu', 'Admin@123')}
            >
              <ShieldCheck size={16} color="var(--primary)" style={{ marginBottom: '4px' }} />
              <span>Admin</span>
            </button>

            <button
              type="button"
              className="demo-chip-btn"
              onClick={() => handleQuickFill('librarian@collegelms.edu', 'Librarian@123')}
            >
              <BookOpen size={16} color="var(--success)" style={{ marginBottom: '4px' }} />
              <span>Librarian</span>
            </button>

            <button
              type="button"
              className="demo-chip-btn"
              onClick={() => handleQuickFill('rahul.sharma@collegelms.edu', 'Student@123')}
            >
              <User size={16} color="#6366f1" style={{ marginBottom: '4px' }} />
              <span>Student</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
