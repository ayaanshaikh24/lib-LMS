const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  toggleStudentStatus
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Student directory is accessible only to Admin and Librarian
router.use(protect, authorize('admin', 'librarian'));

router.get('/', getStudents);
router.get('/:id', getStudentById);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.patch('/:id/status', toggleStudentStatus);

module.exports = router;
