import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import Badge from '../components/Badge';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Filter,
  AlertCircle,
  CheckCircle2,
  BookPlus,
  RefreshCw
} from 'lucide-react';

const BooksPage = () => {
  const { canManage } = useAuth();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [availability, setAvailability] = useState('all');

  // Add/Edit Book Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedBook, setSelectedBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Computer Science',
    publisher: '',
    totalCopies: 5,
    location: ''
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await api.getBooks({
        search,
        category: selectedCategory,
        availability
      });
      if (res.success) {
        setBooks(res.books);
        if (res.categories && res.categories.length > 0) {
          setCategories(['All', ...res.categories]);
        }
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to fetch books' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchBooks();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search, selectedCategory, availability]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedBook(null);
    setFormData({
      title: '',
      author: '',
      isbn: '',
      category: 'Computer Science',
      publisher: '',
      totalCopies: 5,
      location: 'Rack A-01'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (book) => {
    setModalMode('edit');
    setSelectedBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      publisher: book.publisher || '',
      totalCopies: book.totalCopies,
      location: book.location || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim() || !formData.author.trim() || !formData.isbn.trim()) {
      setFormError('Title, author, and ISBN are required.');
      return;
    }

    if (parseInt(formData.totalCopies, 10) < 1) {
      setFormError('Total copies must be at least 1.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        const res = await api.createBook(formData);
        if (res.success) {
          setActionMessage({ type: 'success', text: `Book "${res.book.title}" added to catalog.` });
          setIsModalOpen(false);
          fetchBooks();
        }
      } else {
        const res = await api.updateBook(selectedBook._id, formData);
        if (res.success) {
          setActionMessage({ type: 'success', text: `Book "${res.book.title}" updated successfully.` });
          setIsModalOpen(false);
          fetchBooks();
        }
      }
    } catch (err) {
      setFormError(err.message || 'Error saving book details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!bookToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await api.deleteBook(bookToDelete._id);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        setIsDeleteOpen(false);
        setBookToDelete(null);
        fetchBooks();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to delete book' });
      setIsDeleteOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Nexora Library Catalog</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Browse, search, and manage all academic textbooks and reference volumes
          </p>
        </div>

        {canManage && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Add New Book</span>
          </button>
        )}
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
                placeholder="Search by title, author, ISBN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filters-controls-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={15} color="var(--text-muted)" />
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Category:</span>
                <select
                  className="select-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Management">Management</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Stock:</span>
                <select
                  className="select-filter"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                >
                  <option value="all">All Copies</option>
                  <option value="available">Available In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>

              <button className="btn btn-outline btn-sm" onClick={fetchBooks} title="Refresh catalog">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Books Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading catalog books...
            </div>
          ) : books.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <BookOpen size={40} color="var(--border)" style={{ marginBottom: '12px' }} />
              <h4>No books found matching criteria</h4>
              <p style={{ fontSize: '13px' }}>Try clearing your search query or filters.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title & Author</th>
                    <th>ISBN</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Copies (Available / Total)</th>
                    <th>Status</th>
                    {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => {
                    const isAvailable = book.availableCopies > 0;
                    return (
                      <tr key={book._id}>
                        <td>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>
                            {book.title}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            by {book.author} • {book.publisher}
                          </div>
                        </td>
                        <td>
                          <code style={{ fontSize: '12px', background: 'var(--bg-app)', padding: '2px 6px', borderRadius: '4px' }}>
                            {book.isbn}
                          </code>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', fontWeight: '500' }}>{book.category}</span>
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {book.location || 'Main Shelf'}
                        </td>
                        <td>
                          <span style={{ fontWeight: '700', color: isAvailable ? 'var(--success-text)' : 'var(--danger-text)' }}>
                            {book.availableCopies}
                          </span>
                          <span style={{ color: 'var(--text-light)' }}> / {book.totalCopies}</span>
                        </td>
                        <td>
                          <Badge status={isAvailable ? 'available' : 'out_of_stock'} />
                        </td>
                        {canManage && (
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleOpenEdit(book)}
                                title="Edit Book"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
                                onClick={() => {
                                  setBookToDelete(book);
                                  setIsDeleteOpen(true);
                                }}
                                title="Delete Book"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Book Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Add New Book to Catalog' : 'Edit Book Information'}
      >
        <form onSubmit={handleSubmitForm}>
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
              <label className="form-label">Book Title *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Operating System Concepts"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group form-full">
              <label className="form-label">Author(s) *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Abraham Silberschatz, Peter Galvin"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">ISBN Code *</label>
              <input
                type="text"
                className="form-control"
                placeholder="978-0132350884"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-control"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Management">Management</option>
                <option value="General">General Reference</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Publisher</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Pearson, Wiley"
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Total Copies *</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={formData.totalCopies}
                onChange={(e) => setFormData({ ...formData, totalCopies: parseInt(e.target.value, 10) || 1 })}
                required
              />
            </div>

            <div className="form-group form-full">
              <label className="form-label">Shelf / Rack Location</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Rack CS-03, Shelf 2"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="confirm-modal-actions" style={{ marginTop: '24px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : modalMode === 'create' ? 'Add Book' : 'Update Book'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Book"
        message={`Are you sure you want to delete "${bookToDelete?.title}" (ISBN: ${bookToDelete?.isbn})? This action cannot be undone.`}
        confirmText="Delete Book"
        loading={deleteLoading}
      />
    </div>
  );
};

export default BooksPage;
