const Issue = require('../models/Issue');
const Book = require('../models/Book');
const User = require('../models/User');

// @desc    Generate filtered reports for issues, returns, overdues, and fines
// @route   GET /api/reports
// @access  Private (Admin, Librarian)
const generateReport = async (req, res, next) => {
  try {
    const { type = 'all', fromDate, toDate, department, category } = req.query;

    const matchQuery = {};

    // Date range filter
    if (fromDate || toDate) {
      matchQuery.createdAt = {};
      if (fromDate) matchQuery.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        matchQuery.createdAt.$lte = end;
      }
    }

    // Report Type filter
    if (type === 'issued') {
      matchQuery.status = 'issued';
    } else if (type === 'returned') {
      matchQuery.status = 'returned';
    } else if (type === 'overdue') {
      matchQuery.status = 'overdue';
    } else if (type === 'fines') {
      matchQuery.fineAmount = { $gt: 0 };
    }

    let records = await Issue.find(matchQuery)
      .populate('book', 'title author isbn category location')
      .populate('student', 'name studentId email department phone')
      .populate('issuedBy', 'name role')
      .sort({ createdAt: -1 });

    // In-memory filters for populated fields if requested
    if (department && department !== 'All') {
      records = records.filter((r) => r.student?.department === department);
    }
    if (category && category !== 'All') {
      records = records.filter((r) => r.book?.category === category);
    }

    // Compute summary metrics for this report slice
    const totalRecords = records.length;
    const totalFines = records.reduce((sum, r) => sum + (r.fineAmount || 0), 0);
    const pendingFines = records
      .filter((r) => !r.finePaid)
      .reduce((sum, r) => sum + (r.fineAmount || 0), 0);
    const collectedFines = records
      .filter((r) => r.finePaid)
      .reduce((sum, r) => sum + (r.fineAmount || 0), 0);

    const statusCounts = {
      issued: records.filter((r) => r.status === 'issued').length,
      returned: records.filter((r) => r.status === 'returned').length,
      overdue: records.filter((r) => r.status === 'overdue').length
    };

    return res.status(200).json({
      success: true,
      reportType: type,
      filters: { fromDate, toDate, department, category },
      generatedAt: new Date().toISOString(),
      summary: {
        totalRecords,
        statusCounts,
        totalFines,
        pendingFines,
        collectedFines
      },
      records
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateReport
};
