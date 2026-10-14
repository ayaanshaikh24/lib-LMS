const Book = require('../models/Book');
const User = require('../models/User');
const Issue = require('../models/Issue');
const { calculateOverdueFine } = require('../utils/fineCalculator');

// @desc    Get dashboard metrics and recent circulation activities
// @route   GET /api/dashboard/stats
// @access  Private (Admin, Librarian)
const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();

    // 1. Auto update overdue statuses for any past-due issued books
    await Issue.updateMany(
      {
        status: 'issued',
        dueDate: { $lt: now }
      },
      {
        $set: { status: 'overdue' }
      }
    );

    // 2. Parallel queries for stats
    const [
      booksAgg,
      totalStudents,
      activeStudents,
      currentlyIssued,
      overdueCount,
      finesAgg,
      recentActivity,
      categoryDistribution
    ] = await Promise.all([
      // Book totals
      Book.aggregate([
        {
          $group: {
            _id: null,
            totalTitles: { $sum: 1 },
            totalCopies: { $sum: '$totalCopies' },
            availableCopies: { $sum: '$availableCopies' }
          }
        }
      ]),
      // Students counts
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', isActive: true }),
      // Issued books
      Issue.countDocuments({ status: 'issued' }),
      // Overdue books
      Issue.countDocuments({ status: 'overdue' }),
      // Fines breakdown
      Issue.aggregate([
        {
          $group: {
            _id: null,
            totalFinesAssessed: { $sum: '$fineAmount' },
            pendingFines: {
              $sum: { $cond: [{ $eq: ['$finePaid', false] }, '$fineAmount', 0] }
            },
            collectedFines: {
              $sum: { $cond: [{ $eq: ['$finePaid', true] }, '$fineAmount', 0] }
            }
          }
        }
      ]),
      // Recent activities (latest 8 issues/returns)
      Issue.find()
        .populate('book', 'title author isbn category')
        .populate('student', 'name studentId department')
        .populate('issuedBy', 'name role')
        .sort({ updatedAt: -1 })
        .limit(8),
      // Category breakdown
      Book.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalCopies: { $sum: '$totalCopies' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ])
    ]);

    const bookStats = booksAgg[0] || {
      totalTitles: 0,
      totalCopies: 0,
      availableCopies: 0
    };

    const fineStats = finesAgg[0] || {
      totalFinesAssessed: 0,
      pendingFines: 0,
      collectedFines: 0
    };

    return res.status(200).json({
      success: true,
      stats: {
        totalBooks: bookStats.totalTitles,
        totalCopies: bookStats.totalCopies,
        availableCopies: bookStats.availableCopies,
        issuedCopies: bookStats.totalCopies - bookStats.availableCopies,
        totalStudents,
        activeStudents,
        currentlyIssued,
        overdueBooks: overdueCount,
        pendingFines: fineStats.pendingFines,
        collectedFines: fineStats.collectedFines,
        totalFinesAssessed: fineStats.totalFinesAssessed
      },
      categoryDistribution,
      recentActivity
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
