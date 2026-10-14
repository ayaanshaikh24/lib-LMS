const Issue = require('../models/Issue');
const Book = require('../models/Book');
const User = require('../models/User');
const { calculateOverdueFine } = require('../utils/fineCalculator');

// Helper to determine fine rate from env or default
const getFineRate = () => {
  return parseFloat(process.env.FINE_PER_DAY) || 5;
};

// @desc    Issue an available book to a registered student
// @route   POST /api/issues
// @access  Private (Admin, Librarian)
const issueBook = async (req, res, next) => {
  try {
    const { bookId, studentId, dueDate, notes } = req.body;

    if (!bookId || !studentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both bookId and studentId.'
      });
    }

    // 1. Verify student exists and is active
    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Registered student not found.'
      });
    }

    if (!student.isActive) {
      return res.status(400).json({
        success: false,
        message: `Student account for ${student.name} is deactivated. Cannot issue books.`
      });
    }

    // 2. Check if student already has an active issue for this exact book
    const alreadyIssued = await Issue.findOne({
      student: student._id,
      book: bookId,
      status: { $in: ['issued', 'overdue'] }
    });

    if (alreadyIssued) {
      return res.status(400).json({
        success: false,
        message: `Student ${student.name} already currently has a copy of this book on loan.`
      });
    }

    // 3. Check student borrowing limit (max 5 active books)
    const activeCount = await Issue.countDocuments({
      student: student._id,
      status: { $in: ['issued', 'overdue'] }
    });

    const MAX_BORROW_LIMIT = 5;
    if (activeCount >= MAX_BORROW_LIMIT) {
      return res.status(400).json({
        success: false,
        message: `Borrowing limit reached: Student already has ${activeCount} active book loans (maximum allowed is ${MAX_BORROW_LIMIT}).`
      });
    }

    // 4. Safe atomic decrement of available book copies
    // This strictly prevents race conditions and ensures availableCopies > 0
    const updatedBook = await Book.findOneAndUpdate(
      { _id: bookId, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { returnDocument: 'after' }
    );

    if (!updatedBook) {
      const bookExists = await Book.findById(bookId);
      if (!bookExists) {
        return res.status(404).json({
          success: false,
          message: 'Book not found in library catalog.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `All copies of "${bookExists.title}" are currently issued. No available copies left in stock.`
      });
    }

    // 5. Calculate due date (defaults to configured issue days, e.g. 14 days)
    const issueDate = new Date();
    let calculatedDueDate;
    if (dueDate) {
      calculatedDueDate = new Date(dueDate);
      if (isNaN(calculatedDueDate.getTime()) || calculatedDueDate <= issueDate) {
        // Rollback book stock if invalid dueDate provided
        await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } });
        return res.status(400).json({
          success: false,
          message: 'Due date must be a valid future date after the issue date.'
        });
      }
    } else {
      const defaultDays = parseInt(process.env.DEFAULT_ISSUE_DAYS, 10) || 14;
      calculatedDueDate = new Date(issueDate.getTime() + defaultDays * 24 * 60 * 60 * 1000);
    }

    const newIssue = await Issue.create({
      book: bookId,
      student: student._id,
      issuedBy: req.user._id,
      issueDate,
      dueDate: calculatedDueDate,
      status: 'issued',
      fineAmount: 0,
      finePaid: false,
      notes: notes ? notes.trim() : ''
    });

    const populatedIssue = await Issue.findById(newIssue._id)
      .populate('book', 'title author isbn category location')
      .populate('student', 'name email studentId department phone')
      .populate('issuedBy', 'name email role');

    return res.status(201).json({
      success: true,
      message: `Book "${updatedBook.title}" successfully issued to ${student.name}.`,
      issue: populatedIssue,
      remainingAvailableCopies: updatedBook.availableCopies
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process return of an issued book and calculate fines
// @route   POST /api/issues/:id/return
// @access  Private (Admin, Librarian)
const returnBook = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('book', 'title author isbn')
      .populate('student', 'name studentId email');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue record not found'
      });
    }

    if (issue.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: `This book was already returned on ${new Date(issue.returnDate).toLocaleDateString()}.`
      });
    }

    const returnDate = req.body.returnDate ? new Date(req.body.returnDate) : new Date();
    const fineRate = getFineRate();

    // Calculate overdue fine using pure utility
    const fineResult = calculateOverdueFine(issue.dueDate, returnDate, fineRate);

    // Update Issue record
    issue.returnDate = returnDate;
    issue.status = 'returned';
    issue.fineAmount = fineResult.fineAmount;

    // If no fine was accrued, mark paid automatically
    if (fineResult.fineAmount === 0) {
      issue.finePaid = true;
    } else if (req.body.finePaidImmediately === true) {
      issue.finePaid = true;
      issue.paidAt = new Date();
    }

    if (req.body.notes) {
      issue.notes = req.body.notes.trim();
    }

    await issue.save();

    // Atomically increment available copies of the book
    await Book.findByIdAndUpdate(issue.book._id, { $inc: { availableCopies: 1 } });

    return res.status(200).json({
      success: true,
      message: `Book "${issue.book.title}" returned successfully.`,
      issue,
      fineDetails: {
        isOverdue: fineResult.isOverdue,
        daysOverdue: fineResult.daysOverdue,
        fineAmount: fineResult.fineAmount,
        finePaid: issue.finePaid,
        ratePerDay: fineRate
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all issues with filters (status, student, book, dates)
// @route   GET /api/issues
// @access  Private (Admin, Librarian)
const getIssues = async (req, res, next) => {
  try {
    const { status, studentId, bookId, search, fromDate, toDate, page = 1, limit = 50 } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (studentId) {
      query.student = studentId;
    }

    if (bookId) {
      query.book = bookId;
    }

    if (fromDate || toDate) {
      query.issueDate = {};
      if (fromDate) query.issueDate.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query.issueDate.$lte = end;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    // Auto-update overdue records that haven't been marked yet
    const now = new Date();
    await Issue.updateMany(
      {
        status: 'issued',
        dueDate: { $lt: now }
      },
      {
        $set: { status: 'overdue' }
      }
    );

    let issues = await Issue.find(query)
      .populate('book', 'title author isbn category location')
      .populate('student', 'name email studentId department phone')
      .populate('issuedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Apply text search on populated fields if provided
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      issues = issues.filter(
        (i) =>
          i.book?.title?.toLowerCase().includes(s) ||
          i.book?.isbn?.toLowerCase().includes(s) ||
          i.student?.name?.toLowerCase().includes(s) ||
          i.student?.studentId?.toLowerCase().includes(s)
      );
    }

    const total = await Issue.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: issues.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      issues
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in student's issues
// @route   GET /api/issues/my-loans
// @access  Private (Student)
const getStudentIssues = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    // Auto update overdue status
    const now = new Date();
    await Issue.updateMany(
      {
        student: studentId,
        status: 'issued',
        dueDate: { $lt: now }
      },
      {
        $set: { status: 'overdue' }
      }
    );

    const issues = await Issue.find({ student: studentId })
      .populate('book', 'title author isbn category publisher location')
      .sort({ createdAt: -1 });

    const activeLoans = issues.filter((i) => i.status === 'issued' || i.status === 'overdue');
    const returnedLoans = issues.filter((i) => i.status === 'returned');
    const unpaidFines = issues
      .filter((i) => i.fineAmount > 0 && !i.finePaid)
      .reduce((sum, i) => sum + i.fineAmount, 0);

    return res.status(200).json({
      success: true,
      stats: {
        totalBorrowed: issues.length,
        activeLoansCount: activeLoans.length,
        returnedLoansCount: returnedLoans.length,
        unpaidFinesTotal: unpaidFines
      },
      activeLoans,
      returnedLoans,
      allIssues: issues
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a fine as paid
// @route   PATCH /api/issues/:id/pay-fine
// @access  Private (Admin, Librarian)
const payFine = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('book', 'title')
      .populate('student', 'name studentId');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue record not found'
      });
    }

    if (issue.fineAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'There is no fine recorded for this issue.'
      });
    }

    if (issue.finePaid) {
      return res.status(400).json({
        success: false,
        message: `This fine of ₹${issue.fineAmount} was already paid on ${new Date(issue.paidAt).toLocaleDateString()}.`
      });
    }

    issue.finePaid = true;
    issue.paidAt = new Date();
    await issue.save();

    return res.status(200).json({
      success: true,
      message: `Fine of ₹${issue.fineAmount} for "${issue.book.title}" marked as paid.`,
      issue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all fines overview (pending & paid)
// @route   GET /api/issues/fines
// @access  Private (Admin, Librarian)
const getFinesOverview = async (req, res, next) => {
  try {
    const { status = 'all', page = 1, limit = 50 } = req.query;

    const query = { fineAmount: { $gt: 0 } };

    if (status === 'pending') {
      query.finePaid = false;
    } else if (status === 'paid') {
      query.finePaid = true;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [fines, total, aggregations] = await Promise.all([
      Issue.find(query)
        .populate('book', 'title author isbn')
        .populate('student', 'name studentId email department')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Issue.countDocuments(query),
      Issue.aggregate([
        { $match: { fineAmount: { $gt: 0 } } },
        {
          $group: {
            _id: null,
            totalFinesAmount: { $sum: '$fineAmount' },
            pendingFinesAmount: {
              $sum: { $cond: [{ $eq: ['$finePaid', false] }, '$fineAmount', 0] }
            },
            collectedFinesAmount: {
              $sum: { $cond: [{ $eq: ['$finePaid', true] }, '$fineAmount', 0] }
            },
            pendingCount: {
              $sum: { $cond: [{ $eq: ['$finePaid', false] }, 1, 0] }
            },
            paidCount: {
              $sum: { $cond: [{ $eq: ['$finePaid', true] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    const stats = aggregations[0] || {
      totalFinesAmount: 0,
      pendingFinesAmount: 0,
      collectedFinesAmount: 0,
      pendingCount: 0,
      paidCount: 0
    };

    return res.status(200).json({
      success: true,
      stats,
      count: fines.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      fines
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  issueBook,
  returnBook,
  getIssues,
  getStudentIssues,
  payFine,
  getFinesOverview
};
