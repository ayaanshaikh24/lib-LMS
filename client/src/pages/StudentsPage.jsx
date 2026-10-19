import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import Badge from '../components/Badge';
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  UserX,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  GraduationCap
} from 'lucide-react';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    department: 'Computer Science',
    phone: '',
    password: ''
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Status Toggle Modal
  const [isToggleOpen, setIsToggleOpen] = useState(false);
  const [studentToToggle, setStudentToToggle] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  const [actionMessage, setActionMessage] = useState(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.getStudents({
        search,
        department: selectedDept,
        status: selectedStatus
      });
      if (res.success) {
        setStudents(res.students);
        if (res.departments && res.departments.length > 0) {
          setDepartments(['All', ...res.departments]);
        }
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to fetch students' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchStudents();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search, selectedDept, selectedStatus]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedStudent(null);
    setFormData({
      name: '',
      email: '',
      studentId: '',
      department: 'Computer Science',
      phone: '',
      password: 'Student@123'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setModalMode('edit');
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      studentId: student.studentId,
      department: student.department || 'Computer Science',
      phone: student.phone || '',
      password: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.studentId.trim()) {
      setFormError('Name, institutional email, and Student ID are required.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        const res = await api.createStudent(formData);
        if (res.success) {
          setActionMessage({ type: 'success', text: `Student ${res.student.name} registered successfully.` });
          setIsModalOpen(false);
          fetchStudents();
        }
      } else {
        const res = await api.updateStudent(selectedStudent._id, formData);
        if (res.success) {
          setActionMessage({ type: 'success', text: `Student record for ${res.student.name} updated.` });
          setIsModalOpen(false);
          fetchStudents();
        }
      }
    } catch (err) {
      setFormError(err.message || 'Error saving student information.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmToggle = async () => {
    if (!studentToToggle) return;
    setToggleLoading(true);
    try {
      const res = await api.toggleStudentStatus(studentToToggle._id);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        setIsToggleOpen(false);
        setStudentToToggle(null);
        fetchStudents();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to update student status' });
      setIsToggleOpen(false);
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Student Registry Directory</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Manage student registrations, academic departments, and borrowing permissions
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <UserPlus size={16} />
          <span>Register Student</span>
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
                placeholder="Search by student name, ID, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filters-controls-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={15} color="var(--text-muted)" />
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Department:</span>
                <select
                  className="select-filter"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                >
                  <option value="All">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Status:</span>
                <select
                  className="select-filter"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">All Accounts</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Deactivated Only</option>
                </select>
              </div>

              <button className="btn btn-outline btn-sm" onClick={fetchStudents} title="Refresh directory">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading registered students...
            </div>
          ) : students.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Users size={40} color="var(--border)" style={{ marginBottom: '12px' }} />
              <h4>No student records found</h4>
              <p style={{ fontSize: '13px' }}>Try adjusting your search criteria or register a new student.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Name & ID</th>
                    <th>Institutional Email</th>
                    <th>Department</th>
                    <th>Phone Contact</th>
                    <th>Account Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student._id}>
                      <td>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>
                          {student.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>
                          ID: {student.studentId}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                          <Mail size={13} color="var(--text-light)" />
                          <span>{student.email}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                          <GraduationCap size={14} color="var(--text-light)" />
                          <span>{student.department}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {student.phone || '—'}
                        </span>
                      </td>
                      <td>
                        <Badge status={student.isActive ? 'active' : 'inactive'} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenEdit(student)}
                            title="Edit Student Information"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{
                              color: student.isActive ? 'var(--danger)' : 'var(--success)',
                              borderColor: student.isActive ? 'var(--danger-border)' : 'var(--success-border)'
                            }}
                            onClick={() => {
                              setStudentToToggle(student);
                              setIsToggleOpen(true);
                            }}
                            title={student.isActive ? 'Deactivate Account' : 'Activate Account'}
                          >
                            {student.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Register New Student' : 'Edit Student Details'}
      >
        <form onSubmit={handleSubmit}>
          {formError && (
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
              <span>{formError}</span>
            </div>
          )}

          <div className="form-grid">
            <div className="form-group form-full">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Student ID *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. CS2023001"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Institutional Email *</label>
              <input
                type="email"
                className="form-control"
                placeholder="rahul.sharma@collegelms.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                className="form-control"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                className="form-control"
                placeholder="+91 98765 00000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group form-full">
              <label className="form-label">
                {modalMode === 'create' ? 'Initial Account Password' : 'Reset Password (optional)'}
              </label>
              <input
                type="password"
                className="form-control"
                placeholder={modalMode === 'create' ? 'Defaults to Student@123' : 'Leave empty to keep unchanged'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="confirm-modal-actions" style={{ marginTop: '24px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : modalMode === 'create' ? 'Register Student' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Toggle Active / Deactivate Confirm Modal */}
      <ConfirmModal
        isOpen={isToggleOpen}
        onClose={() => setIsToggleOpen(false)}
        onConfirm={handleConfirmToggle}
        title={studentToToggle?.isActive ? 'Deactivate Student Account' : 'Reactivate Student Account'}
        message={
          studentToToggle?.isActive
            ? `Are you sure you want to deactivate ${studentToToggle?.name}'s account? Deactivated students cannot borrow library books.`
            : `Are you sure you want to reactivate ${studentToToggle?.name}'s account? They will regain borrowing privileges.`
        }
        confirmText={studentToToggle?.isActive ? 'Deactivate' : 'Reactivate'}
        type={studentToToggle?.isActive ? 'danger' : 'primary'}
        loading={toggleLoading}
      />
    </div>
  );
};

export default StudentsPage;
