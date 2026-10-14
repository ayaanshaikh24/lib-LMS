import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import {
  BookOpen,
  CheckCircle2,
  Users,
  Repeat,
  AlertTriangle,
  DollarSign,
  PlusCircle,
  FileText,
  Clock,
  ArrowRight,
  BookMarked
} from 'lucide-react';

const DashboardPage = () => {
  const { user, canManage, isStudent } = useAuth();
  const [stats, setStats] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        if (canManage) {
          const res = await api.getDashboardStats();
          if (res.success) {
            setStats(res.stats);
            setRecentActivity(res.recentActivity || []);
          }
        } else if (isStudent) {
          const res = await api.getMyLoans();
          if (res.success) {
            setStudentStats(res);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [canManage, isStudent]);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Clock size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
        <p>Loading dashboard metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '30px', textAlign: 'center', borderLeft: '4px solid var(--danger)' }}>
        <AlertTriangle size={32} color="var(--danger)" style={{ marginBottom: '10px' }} />
        <h3 style={{ fontSize: '18px', marginBottom: '6px' }}>Unable to load dashboard</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{error}</p>
      </div>
    );
  }

  // ==========================================
  // Student Dashboard View
  // ==========================================
  if (isStudent && studentStats) {
    const { stats: sStats, activeLoans = [] } = studentStats;
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)' }}>
            Welcome back, {user?.name}!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Student ID: <strong>{user?.studentId}</strong> | Department: {user?.department}
          </p>
        </div>

        <div className="stat-cards-grid">
          <StatCard
            label="Current Loans"
            value={sStats?.activeLoansCount || 0}
            subtext="Books currently in possession"
            icon={BookMarked}
            color="blue"
          />
          <StatCard
            label="Returned Books"
            value={sStats?.returnedLoansCount || 0}
            subtext="Completed loan history"
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            label="Pending Fines"
            value={`₹${sStats?.unpaidFinesTotal || 0}`}
            subtext={sStats?.unpaidFinesTotal > 0 ? 'Payable at circulation desk' : 'No overdue fines'}
            icon={DollarSign}
            color={sStats?.unpaidFinesTotal > 0 ? 'red' : 'green'}
          />
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <BookOpen size={18} />
              <span>Currently Borrowed Books</span>
            </h3>
            <Link to="/books" className="btn btn-outline btn-sm">
              <span>Browse Library Catalog</span>
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {activeLoans.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <BookOpen size={36} color="var(--border)" style={{ marginBottom: '10px' }} />
                <p style={{ fontWeight: '600' }}>You currently have no active book loans.</p>
                <p style={{ fontSize: '13px' }}>Visit the library or browse the catalog to check out books.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Book Title</th>
                      <th>ISBN</th>
                      <th>Category</th>
                      <th>Issue Date</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeLoans.map((loan) => (
                      <tr key={loan._id}>
                        <td style={{ fontWeight: '600' }}>{loan.book?.title}</td>
                        <td>
                          <code style={{ fontSize: '12px', background: 'var(--bg-app)', padding: '2px 6px', borderRadius: '4px' }}>
                            {loan.book?.isbn}
                          </code>
                        </td>
                        <td>{loan.book?.category}</td>
                        <td>{new Date(loan.issueDate).toLocaleDateString()}</td>
                        <td style={{ fontWeight: '600', color: loan.status === 'overdue' ? 'var(--danger)' : 'inherit' }}>
                          {new Date(loan.dueDate).toLocaleDateString()}
                        </td>
                        <td>
                          <Badge status={loan.status} />
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
  }

  // ==========================================
  // Admin & Librarian Dashboard View
  // ==========================================
  return (
    <div>
      {/* Overdue Warning Banner */}
      {stats?.overdueBooks > 0 && (
        <div
          style={{
            backgroundColor: 'var(--danger-light)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={22} color="var(--danger)" />
            <div>
              <strong style={{ color: 'var(--danger-text)', fontSize: '14.5px' }}>
                {stats.overdueBooks} Overdue {stats.overdueBooks === 1 ? 'Book' : 'Books'} Detected
              </strong>
              <p style={{ color: 'var(--danger-text)', fontSize: '13px', margin: 0 }}>
                Pending overdue fines total: <strong>₹{stats.pendingFines}</strong>. Overdue notices should be issued.
              </p>
            </div>
          </div>
          <Link to="/issues?status=overdue" className="btn btn-danger btn-sm">
            View Overdue Loans
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="stat-cards-grid">
        <StatCard
          label="Total Book Titles"
          value={stats?.totalBooks || 0}
          subtext={`${stats?.totalCopies || 0} total physical copies`}
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          label="Available In Stock"
          value={stats?.availableCopies || 0}
          subtext={`${stats?.issuedCopies || 0} copies currently issued`}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          label="Registered Students"
          value={stats?.totalStudents || 0}
          subtext={`${stats?.activeStudents || 0} active accounts`}
          icon={Users}
          color="indigo"
        />
        <StatCard
          label="Currently Issued"
          value={stats?.currentlyIssued || 0}
          subtext="Active borrowing records"
          icon={Repeat}
          color="blue"
        />
        <StatCard
          label="Overdue Books"
          value={stats?.overdueBooks || 0}
          subtext="Loans past scheduled due date"
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          label="Pending Fines"
          value={`₹${stats?.pendingFines || 0}`}
          subtext={`₹${stats?.collectedFines || 0} collected to date`}
          icon={DollarSign}
          color="amber"
        />
      </div>

      {/* Quick Actions & Recent Activity Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <PlusCircle size={18} />
              <span>Circulation Shortcuts</span>
            </h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link
              to="/issues"
              className="btn btn-primary"
              style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
            >
              <Repeat size={18} />
              <span>Issue / Return Circulation Desk</span>
            </Link>

            <Link
              to="/books"
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
            >
              <BookOpen size={18} />
              <span>Manage Books Catalog</span>
            </Link>

            <Link
              to="/students"
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
            >
              <Users size={18} />
              <span>Register / Manage Students</span>
            </Link>

            <Link
              to="/reports"
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
            >
              <FileText size={18} />
              <span>Generate Audit & Circulation Reports</span>
            </Link>
          </div>
        </div>

        {/* Recent Circulation Activities */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <h3 className="card-title">
              <Repeat size={18} />
              <span>Recent Issue & Return Activity</span>
            </h3>
            <Link to="/issues" className="btn btn-outline btn-sm">
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentActivity.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No recent circulation activities recorded.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Student</th>
                      <th>Issue Date</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Fine</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div style={{ fontWeight: '600' }}>{item.book?.title || 'Unknown Title'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            ISBN: {item.book?.isbn}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '500' }}>{item.student?.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {item.student?.studentId}
                          </div>
                        </td>
                        <td>{new Date(item.issueDate).toLocaleDateString()}</td>
                        <td>{new Date(item.dueDate).toLocaleDateString()}</td>
                        <td>
                          <Badge status={item.status} />
                        </td>
                        <td>
                          {item.fineAmount > 0 ? (
                            <span style={{ fontWeight: '600', color: item.finePaid ? 'var(--success)' : 'var(--danger)' }}>
                              ₹{item.fineAmount} ({item.finePaid ? 'Paid' : 'Pending'})
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-light)' }}>—</span>
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
    </div>
  );
};

export default DashboardPage;
