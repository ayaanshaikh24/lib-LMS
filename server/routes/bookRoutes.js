const express = require('express');
const router = express.Router();
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
} = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All authenticated users can search and view books
router.get('/', protect, getBooks);
router.get('/:id', protect, getBookById);

// Only Admin and Librarian can modify the book catalog
router.post('/', protect, authorize('admin', 'librarian'), createBook);
router.put('/:id', protect, authorize('admin', 'librarian'), updateBook);
router.delete('/:id', protect, authorize('admin', 'librarian'), deleteBook);

module.exports = router;
