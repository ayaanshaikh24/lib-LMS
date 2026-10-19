import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import StatCard from '../components/StatCard';
import ConfirmModal from '../components/ConfirmModal';
import Badge from '../components/Badge';
import { DollarSign, AlertCircle, CheckCircle2, Clock, Filter, CreditCard } from 'lucide-react';

const FinesPage = () => {
  const [fines, setFines] = useState([]);
  const [stats, setStats] = useState({
    totalFinesAmount: 0,
    pendingFinesAmount: 0,
    collectedFinesAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Pay Fine Confirmation Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [fineToPay, setFineToPay] = useState(null);
  const [paying, setPaying] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchFines = async () => {
    setLoading(true);
    try {
      const res = await api.getFines({ status: statusFilter });
      if (res.success) {
        setFines(res.fines);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to load fines ledger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, [statusFilter]);

  const handleOpenPay = (fine) => {
    setFineToPay(fine);
    setIsPayModalOpen(true);
  };

  const handleConfirmPay = async () => {
    if (!fineToPay) return;
    setPaying(true);
    try {
      const res = await api.payFine(fineToPay._id);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        setIsPayModalOpen(false);
        setFineToPay(null);
        fetchFines();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Error processing fine payment' });
      setIsPayModalOpen(false);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Library Fines & Penalties Ledger</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Monitor overdue fees, verify payment receipts, and collect outstanding penalties
        </p>
      </div>

      {actionMessage && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: actionMessage.type === 'success' ? 'var(--success-light)' : 'var(--danger-light)',
            color: actionMessage.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
            border: `1px solid ${actionMessage.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {actionMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="stat-cards-grid">
        <StatCard
          label="Total Assessed Fines"
          value={`₹${stats.totalFinesAmount || 0}`}
          subtext="Cumulative overdue charges"
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          label="Pending Uncollected"
          value={`₹${stats.pendingFinesAmount || 0}`}
          subtext="Awaiting student settlement"
          icon={AlertCircle}
          color="red"
        />
        <StatCard
          label="Collected Revenue"
          value={`₹${stats.collectedFinesAmount || 0}`}
          subtext="Successfully paid & reconciled"
          icon={CheckCircle2}
          color="green"
        />
      </div>

      {/* Filter Tabs */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px' }}>
          <div className="filters-controls-row">
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Filter Ledger:</span>
            <button
              className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setStatusFilter('all')}
            >
              All Records
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setStatusFilter('pending')}
            >
              Pending Fines Only
            </button>
            <button
              className={`btn btn-sm ${statusFilter === 'paid' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setStatusFilter('paid')}
            >
              Paid Receipts Only
            </button>
          </div>
        </div>
      </div>

      {/* Fines Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading fines ledger...
            </div>
          ) : fines.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={40} color="var(--success)" style={{ marginBottom: '12px' }} />
              <h4>No fine records found</h4>
              <p style={{ fontSize: '13px' }}>There are currently no overdue charges matching this filter.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Name & ID</th>
                    <th>Book Title</th>
                    <th>Due Date</th>
                    <th>Return Date</th>
                    <th>Fine Assessed</th>
                    <th>Payment Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {fines.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{item.student?.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600' }}>
                          ID: {item.student?.studentId} • {item.student?.department}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{item.book?.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          ISBN: {item.book?.isbn}
                        </div>
                      </td>
                      <td>{new Date(item.dueDate).toLocaleDateString()}</td>
                      <td>
                        {item.returnDate ? new Date(item.returnDate).toLocaleDateString() : 'Not returned yet'}
                      </td>
                      <td>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: item.finePaid ? 'var(--text-main)' : 'var(--danger)' }}>
                          ₹{item.fineAmount}
                        </span>
                      </td>
                      <td>
                        <Badge status={item.finePaid ? 'paid' : 'pending'} />
                        {item.finePaid && item.paidAt && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Paid on {new Date(item.paidAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {!item.finePaid ? (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOpenPay(item)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <CreditCard size={13} />
                            <span>Mark Paid</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--success-text)', fontWeight: '600' }}>
                            ✓ Settled
                          </span>
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

      {/* Pay Fine Confirm Modal */}
      <ConfirmModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        onConfirm={handleConfirmPay}
        title="Collect Overdue Fine"
        message={`Confirm collection of ₹${fineToPay?.fineAmount} from ${fineToPay?.student?.name} (Student ID: ${fineToPay?.student?.studentId}) for "${fineToPay?.book?.title}". This will record the fine as fully paid.`}
        confirmText="Confirm Collection"
        type="primary"
        loading={paying}
      />
    </div>
  );
};

export default FinesPage;
