const express = require('express');
const router = express.Router();
const {
  issueBook,
  returnBook,
  getIssues,
  getStudentIssues,
  payFine,
  getFinesOverview
} = require('../controllers/issueController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Student self-service endpoint
router.get('/my-loans', getStudentIssues);

// Admin & Librarian circulation management endpoints
router.get('/', authorize('admin', 'librarian'), getIssues);
router.post('/', authorize('admin', 'librarian'), issueBook);
router.post('/:id/return', authorize('admin', 'librarian'), returnBook);
router.get('/fines', authorize('admin', 'librarian'), getFinesOverview);
router.patch('/:id/pay-fine', authorize('admin', 'librarian'), payFine);

module.exports = router;
