import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Badge from '../components/Badge';
import {
  FileBarChart,
  Printer,
  Calendar,
  Filter,
  RefreshCw,
  BookOpen,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const ReportsPage = () => {
  const [reportType, setReportType] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [department, setDepartment] = useState('All');

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getReports({
        type: reportType,
        fromDate,
        toDate,
        department
      });
      if (res.success) {
        setReportData(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, department]);

  const handleApplyDateFilter = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = reportData?.summary || {
    totalRecords: 0,
    statusCounts: { issued: 0, returned: 0, overdue: 0 },
    totalFines: 0,
    pendingFines: 0,
    collectedFines: 0
  };

  return (
    <div>
      {/* Printable Header - Only shown during browser printing */}
      <div className="print-only-header">
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Nexora Library Management System</h1>
        <h2 style={{ fontSize: '18px', margin: '4px 0' }}>
          Official Circulation & Audit Report: {reportType.toUpperCase()}
        </h2>
        <p style={{ fontSize: '12px', color: '#555' }}>
          Generated on: {new Date().toLocaleString()} • Filter Range: {fromDate || 'All Time'} to {toDate || 'Present'}
        </p>
      </div>

      {/* Screen Header */}
      <div className="page-header-row no-print">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Circulation & Audit Reports</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Generate official library statistics, audit trails, and printable records
          </p>
        </div>

        <button className="btn btn-primary" onClick={handlePrint}>
          <Printer size={16} />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Report Type Selector & Date Filter Controls */}
      <div className="card no-print" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '18px' }}>
          <form onSubmit={handleApplyDateFilter} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="filters-controls-row">
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Report Type:</span>
              <button
                type="button"
                className={`btn btn-sm ${reportType === 'all' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setReportType('all')}
              >
                All Circulation Logs
              </button>
              <button
                type="button"
                className={`btn btn-sm ${reportType === 'issued' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setReportType('issued')}
              >
                Currently Issued
              </button>
              <button
                type="button"
                className={`btn btn-sm ${reportType === 'returned' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setReportType('returned')}
              >
                Returned Books
              </button>
              <button
                type="button"
                className={`btn btn-sm ${reportType === 'overdue' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setReportType('overdue')}
              >
                Overdue Books
              </button>
              <button
                type="button"
                className={`btn btn-sm ${reportType === 'fines' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setReportType('fines')}
              >
                Fines & Penalties
              </button>
            </div>

            <div className="filters-controls-row" style={{ paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} color="var(--text-muted)" />
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>From:</span>
                <input
                  type="date"
                  className="form-control"
                  style={{ padding: '6px 10px', fontSize: '13px' }}
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>To:</span>
                <input
                  type="date"
                  className="form-control"
                  style={{ padding: '6px 10px', fontSize: '13px' }}
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Department:</span>
                <select
                  className="select-filter"
                  style={{ padding: '6px 10px', fontSize: '13px' }}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="All">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                </select>
              </div>

              <button type="submit" className="btn btn-secondary btn-sm">
                Apply Date Filters
              </button>

              {(fromDate || toDate) && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setFromDate('');
                    setToDate('');
                    fetchReport();
                  }}
                >
                  Clear Dates
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Summary KPI Highlights */}
      <div className="stat-cards-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div>
            <div className="stat-label">Filtered Records</div>
            <div className="stat-value">{summary.totalRecords}</div>
            <div className="stat-subtext">Total matched entries</div>
          </div>
          <div className="stat-icon-wrapper stat-icon-blue">
            <BookOpen size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Active / Returned</div>
            <div className="stat-value">
              {summary.statusCounts.issued} / {summary.statusCounts.returned}
            </div>
            <div className="stat-subtext">Circulation breakdown</div>
          </div>
          <div className="stat-icon-wrapper stat-icon-green">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Overdue Records</div>
            <div className="stat-value" style={{ color: summary.statusCounts.overdue > 0 ? 'var(--danger)' : 'inherit' }}>
              {summary.statusCounts.overdue}
            </div>
            <div className="stat-subtext">Require return/notice</div>
          </div>
          <div className="stat-icon-wrapper stat-icon-red">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Pending Fines</div>
            <div className="stat-value" style={{ color: summary.pendingFines > 0 ? 'var(--danger)' : 'inherit' }}>
              ₹{summary.pendingFines}
            </div>
            <div className="stat-subtext">₹{summary.collectedFines} collected</div>
          </div>
          <div className="stat-icon-wrapper stat-icon-amber">
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      {/* Report Records Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <FileBarChart size={18} />
            <span>Circulation Audit Ledger ({reportData?.records?.length || 0} entries)</span>
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Report timestamp: {new Date().toLocaleDateString()}
          </span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Generating report data...
            </div>
          ) : !reportData?.records || reportData.records.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileBarChart size={40} color="var(--border)" style={{ marginBottom: '12px' }} />
              <h4>No records match the selected report parameters</h4>
              <p style={{ fontSize: '13px' }}>Adjust your filters or date ranges.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Book Title & ISBN</th>
                    <th>Student Borrower</th>
                    <th>Department</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Return Date</th>
                    <th>Status</th>
                    <th>Fine</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.records.map((item, index) => (
                    <tr key={item._id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{index + 1}</td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{item.book?.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          ISBN: {item.book?.isbn}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{item.student?.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600' }}>
                          ID: {item.student?.studentId}
                        </div>
                      </td>
                      <td>{item.student?.department}</td>
                      <td>{new Date(item.issueDate).toLocaleDateString()}</td>
                      <td>{new Date(item.dueDate).toLocaleDateString()}</td>
                      <td>
                        {item.returnDate ? new Date(item.returnDate).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <Badge status={item.status} />
                      </td>
                      <td>
                        {item.fineAmount > 0 ? (
                          <span style={{ fontWeight: '600', color: item.finePaid ? 'var(--success)' : 'var(--danger)' }}>
                            ₹{item.fineAmount} ({item.finePaid ? 'Paid' : 'Pending'})
                          </span>
                        ) : (
                          '₹0'
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

export default ReportsPage;
