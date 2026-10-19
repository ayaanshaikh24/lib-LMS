import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';
import {
  BookMarked,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BookOpen,
  DollarSign,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MyBooksPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('active'); // 'active' | 'returned'

  useEffect(() => {
    const fetchMyLoans = async () => {
      setLoading(true);
      try {
        const res = await api.getMyLoans();
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        setError(err.message || 'Failed to load your borrowing records');
      } finally {
        setLoading(false);
      }
    };

    fetchMyLoans();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Clock size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
        <p>Loading your library records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '24px', color: 'var(--danger)' }}>
        {error}
      </div>
    );
  }

  const { activeLoans = [], returnedLoans = [], stats = {} } = data || {};

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800' }}>My Library Books & Borrowing History</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Registered to: <strong>{user?.name}</strong> • Student ID: <strong>{user?.studentId}</strong> • Department: {user?.department}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="stat-cards-grid">
        <div className="stat-card">
          <div>
            <div className="stat-label">Currently Borrowed</div>
            <div className="stat-value">{stats.activeLoansCount || 0}</div>
            <div className="stat-subtext">Active books in possession</div>
          </div>
          <div className="stat-icon-wrapper stat-icon-blue">
            <BookMarked size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Past Returns</div>
            <div className="stat-value">{stats.returnedLoansCount || 0}</div>
            <div className="stat-subtext">Completed returns</div>
          </div>
          <div className="stat-icon-wrapper stat-icon-green">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Pending Fines</div>
            <div className="stat-value" style={{ color: stats.unpaidFinesTotal > 0 ? 'var(--danger)' : 'inherit' }}>
              ₹{stats.unpaidFinesTotal || 0}
            </div>
            <div className="stat-subtext">
              {stats.unpaidFinesTotal > 0 ? 'Payable at circulation desk' : 'No overdue penalties'}
            </div>
          </div>
          <div className="stat-icon-wrapper stat-icon-amber">
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px' }}>
          <div className="filters-controls-row">
            <button
              className={`btn btn-sm ${tab === 'active' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setTab('active')}
            >
              Active Borrowed Books ({activeLoans.length})
            </button>
            <button
              className={`btn btn-sm ${tab === 'returned' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setTab('returned')}
            >
              Returned History ({returnedLoans.length})
            </button>
            <Link to="/books" className="btn btn-secondary btn-sm">
              <BookOpen size={14} />
              <span>Search Catalog</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Loan Records Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {tab === 'active' ? (
            activeLoans.length === 0 ? (
              <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <BookOpen size={40} color="var(--border)" style={{ marginBottom: '12px' }} />
                <h4>No active book loans</h4>
                <p style={{ fontSize: '13px' }}>You have returned all borrowed textbooks. Visit the catalog to check out books.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Book Details</th>
                      <th>Category & Location</th>
                      <th>Issue Date</th>
                      <th>Scheduled Due Date</th>
                      <th>Loan Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeLoans.map((loan) => {
                      const isOverdue = loan.status === 'overdue';
                      const dueDate = new Date(loan.dueDate);
                      const now = new Date();
                      const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

                      return (
                        <tr key={loan._id}>
                          <td>
                            <div style={{ fontWeight: '700', fontSize: '14px' }}>{loan.book?.title}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              by {loan.book?.author} • ISBN: {loan.book?.isbn}
                            </div>
                          </td>
                          <td>
                            <div>{loan.book?.category}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {loan.book?.location || 'Main Shelf'}
                            </div>
                          </td>
                          <td>{new Date(loan.issueDate).toLocaleDateString()}</td>
                          <td>
                            <div style={{ fontWeight: '700', color: isOverdue ? 'var(--danger)' : 'inherit' }}>
                              {dueDate.toLocaleDateString()}
                            </div>
                            <div
                              style={{
                                fontSize: '11px',
                                fontWeight: '600',
                                color: isOverdue ? 'var(--danger)' : daysLeft <= 3 ? 'var(--warning-text)' : 'var(--text-muted)'
                              }}
                            >
                              {isOverdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days remaining`}
                            </div>
                          </td>
                          <td>
                            <Badge status={loan.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : returnedLoans.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Clock size={40} color="var(--border)" style={{ marginBottom: '12px' }} />
              <h4>No return history yet</h4>
              <p style={{ fontSize: '13px' }}>Returned books will appear here once processed by the library.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Book Details</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Actual Return Date</th>
                    <th>Fine Assessed</th>
                  </tr>
                </thead>
                <tbody>
                  {returnedLoans.map((loan) => (
                    <tr key={loan._id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{loan.book?.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          ISBN: {loan.book?.isbn}
                        </div>
                      </td>
                      <td>{new Date(loan.issueDate).toLocaleDateString()}</td>
                      <td>{new Date(loan.dueDate).toLocaleDateString()}</td>
                      <td>{loan.returnDate ? new Date(loan.returnDate).toLocaleDateString() : '—'}</td>
                      <td>
                        {loan.fineAmount > 0 ? (
                          <span style={{ fontWeight: '600', color: loan.finePaid ? 'var(--success)' : 'var(--danger)' }}>
                            ₹{loan.fineAmount} ({loan.finePaid ? 'Paid' : 'Unpaid'})
                          </span>
                        ) : (
                          <span style={{ color: 'var(--success)' }}>₹0 (On Time)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBooksPage;
