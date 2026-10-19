import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import {
  Repeat,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  DollarSign,
  Calendar,
  BookOpen,
  User,
  Clock
} from 'lucide-react';

const IssuesPage = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Issue Book Modal
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [availableBooks, setAvailableBooks] = useState([]);
  const [activeStudents, setActiveStudents] = useState([]);
  const [issueFormData, setIssueFormData] = useState({
    bookId: '',
    studentId: '',
    dueDate: '',
    notes: ''
  });
  const [issueFormError, setIssueFormError] = useState('');
  const [submittingIssue, setSubmittingIssue] = useState(false);

  // Return Book Modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedIssueForReturn, setSelectedIssueForReturn] = useState(null);
  const [fineEstimate, setFineEstimate] = useState(0);
  const [isFinePaidImmediately, setIsFinePaidImmediately] = useState(true);
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Feedback Notification
  const [actionMessage, setActionMessage] = useState(null);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await api.getIssues({
        status: statusFilter,
        search
      });
      if (res.success) {
        setIssues(res.issues);
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to load issues' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchIssues();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [statusFilter, search]);

  // Load books & students when opening the Issue modal
  const handleOpenIssueModal = async () => {
    setIssueFormError('');
    // Calculate default due date (14 days ahead)
    const defaultDue = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setIssueFormData({
      bookId: '',
      studentId: '',
      dueDate: defaultDue,
      notes: ''
    });

    try {
      const [booksRes, studentsRes] = await Promise.all([
        api.getBooks({ availability: 'available', limit: 100 }),
        api.getStudents({ status: 'active', limit: 100 })
      ]);

      setAvailableBooks(booksRes.books || []);
      setActiveStudents(studentsRes.students || []);
      setIsIssueModalOpen(true);
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Failed to load available catalog or student records' });
    }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    setIssueFormError('');

    if (!issueFormData.bookId || !issueFormData.studentId) {
      setIssueFormError('Please select both a student and an available book.');
      return;
    }

    setSubmittingIssue(true);
    try {
      const res = await api.issueBook(issueFormData);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        setIsIssueModalOpen(false);
        fetchIssues();
      }
    } catch (err) {
      setIssueFormError(err.message || 'Error creating book loan');
    } finally {
      setSubmittingIssue(false);
    }
  };

  const handleOpenReturnModal = (issue) => {
    setSelectedIssueForReturn(issue);

    // Calculate approximate fine in real time
    const now = new Date();
    const due = new Date(issue.dueDate);
    let calculatedFine = 0;
    if (now > due) {
      const diffMs = now.getTime() - due.getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      calculatedFine = Math.max(0, days * 5); // default ₹5/day
    }
    setFineEstimate(calculatedFine);
    setIsFinePaidImmediately(calculatedFine > 0);
    setIsReturnModalOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (!selectedIssueForReturn) return;
    setSubmittingReturn(true);
    try {
      const res = await api.returnBook(selectedIssueForReturn._id, {
        returnDate: new Date().toISOString(),
        finePaidImmediately: isFinePaidImmediately
      });
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `Book returned successfully. ${
            res.fineDetails?.fineAmount > 0
              ? `Fine assessed: ₹${res.fineDetails.fineAmount} (${isFinePaidImmediately ? 'Paid' : 'Recorded Pending'})`
              : 'No fine.'
          }`
        });
        setIsReturnModalOpen(false);
        setSelectedIssueForReturn(null);
        fetchIssues();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Error processing book return' });
      setIsReturnModalOpen(false);
    } finally {
      setSubmittingReturn(false);
    }
  };

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Circulation Desk: Issues & Returns</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Check out books to students, process book returns, and track due dates
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenIssueModal}>
          <Plus size={16} />
          <span>Issue Book</span>
        </button>
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

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px' }}>
          <div className="filters-bar" style={{ margin: 0 }}>
            <div className="search-input-wrapper">
              <Search className="search-input-icon" size={18} />
              <input
                type="text"
                className="search-input"
                placeholder="Search by book title, student name, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filters-controls-row">
              <button
                className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStatusFilter('all')}
              >
                All Loans
              </button>
              <button
                className={`btn btn-sm ${statusFilter === 'issued' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStatusFilter('issued')}
              >
                Active Issued
              </button>
              <button
                className={`btn btn-sm ${statusFilter === 'overdue' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStatusFilter('overdue')}
              >
                Overdue
              </button>
              <button
                className={`btn btn-sm ${statusFilter === 'returned' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStatusFilter('returned')}
              >
                Returned
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading circulation records...
            </div>
          ) : issues.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Repeat size={40} color="var(--border)" style={{ marginBottom: '12px' }} />
              <h4>No circulation records found</h4>
              <p style={{ fontSize: '13px' }}>Issue a book to create your first circulation record.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Book Details</th>
                    <th>Student Borrower</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Fine</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((item) => {
                    const isOverdue = item.status === 'overdue';
                    const isIssued = item.status === 'issued' || item.status === 'overdue';
                    return (
                      <tr key={item._id}>
                        <td>
                          <div style={{ fontWeight: '700', fontSize: '13.5px' }}>{item.book?.title}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            ISBN: {item.book?.isbn} • Loc: {item.book?.location || 'General'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600' }}>{item.student?.name}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--primary)', fontWeight: '600' }}>
                            ID: {item.student?.studentId} • {item.student?.department}
                          </div>
                        </td>
                        <td>{new Date(item.issueDate).toLocaleDateString()}</td>
                        <td style={{ fontWeight: isOverdue ? '700' : '500', color: isOverdue ? 'var(--danger)' : 'inherit' }}>
                          {new Date(item.dueDate).toLocaleDateString()}
                        </td>
                        <td>
                          <Badge status={item.status} />
                        </td>
                        <td>
                          {item.fineAmount > 0 ? (
                            <span style={{ fontWeight: '600', color: item.finePaid ? 'var(--success)' : 'var(--danger)' }}>
                              ₹{item.fineAmount} {item.finePaid ? '✓' : '(Pending)'}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-light)' }}>₹0</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {isIssued ? (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenReturnModal(item)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <RotateCcw size={13} />
                              <span>Process Return</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              Returned {new Date(item.returnDate).toLocaleDateString()}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Issue Book Modal */}
      <Modal isOpen={isIssueModalOpen} onClose={() => setIsIssueModalOpen(false)} title="Issue Book to Student">
        <form onSubmit={handleIssueSubmit}>
          {issueFormError && (
            <div
              style={{
                backgroundColor: 'var(--danger-light)',
                color: 'var(--danger-text)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={16} />
              <span>{issueFormError}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Select Registered Student *</label>
              <select
                className="form-control"
                value={issueFormData.studentId}
                onChange={(e) => setIssueFormData({ ...issueFormData, studentId: e.target.value })}
                required
              >
                <option value="">-- Choose Student --</option>
                {activeStudents.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.studentId} - {s.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Select Available Book *</label>
              <select
                className="form-control"
                value={issueFormData.bookId}
                onChange={(e) => setIssueFormData({ ...issueFormData, bookId: e.target.value })}
                required
              >
                <option value="">-- Choose Book in Stock --</option>
                {availableBooks.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.title} (Available: {b.availableCopies}/{b.totalCopies} - {b.isbn})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Scheduled Due Date *</label>
              <input
                type="date"
                className="form-control"
                value={issueFormData.dueDate}
                onChange={(e) => setIssueFormData({ ...issueFormData, dueDate: e.target.value })}
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Standard loan policy: 14 days from issue date
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Notes / Remarks</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Semester project reference"
                value={issueFormData.notes}
                onChange={(e) => setIssueFormData({ ...issueFormData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="confirm-modal-actions" style={{ marginTop: '24px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsIssueModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submittingIssue}>
              {submittingIssue ? 'Issuing...' : 'Complete Issue'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Return Book Modal */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        title="Confirm Book Return"
        maxWidth="480px"
      >
        <div>
          <div style={{ marginBottom: '18px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
              {selectedIssueForReturn?.book?.title}
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Borrowed by: <strong>{selectedIssueForReturn?.student?.name}</strong> (ID: {selectedIssueForReturn?.student?.studentId})
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-app)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              border: '1px solid var(--border)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Scheduled Due Date:</span>
              <strong>{new Date(selectedIssueForReturn?.dueDate).toLocaleDateString()}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Return Date:</span>
              <strong>{new Date().toLocaleDateString()}</strong>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px dashed var(--border)',
                fontSize: '14px'
              }}
            >
              <span>Calculated Fine:</span>
              <strong style={{ color: fineEstimate > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {fineEstimate > 0 ? `₹${fineEstimate} (Overdue)` : '₹0 (On Time)'}
              </strong>
            </div>
          </div>

          {fineEstimate > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={isFinePaidImmediately}
                  onChange={(e) => setIsFinePaidImmediately(e.target.checked)}
                />
                <span>Collect fine of ₹{fineEstimate} immediately at circulation desk</span>
              </label>
            </div>
          )}

          <div className="confirm-modal-actions">
            <button className="btn btn-outline" onClick={() => setIsReturnModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleConfirmReturn} disabled={submittingReturn}>
              {submittingReturn ? 'Processing...' : 'Confirm Return'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default IssuesPage;
