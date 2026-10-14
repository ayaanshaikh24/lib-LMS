const Book = require('../models/Book');
const Issue = require('../models/Issue');

// @desc    Get all books with search, filter, and pagination
// @route   GET /api/books
// @access  Private (all roles)
const getBooks = async (req, res, next) => {
  try {
    const { search, category, availability, page = 1, limit = 50, sort = 'createdAt', order = 'desc' } = req.query;

    const query = {};

    // Search keyword
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { author: regex },
        { isbn: regex },
        { category: regex },
        { publisher: regex }
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Availability filter
    if (availability === 'available') {
      query.availableCopies = { $gt: 0 };
    } else if (availability === 'out_of_stock') {
      query.availableCopies = { $lte: 0 };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const sortOption = {};
    sortOption[sort] = order === 'asc' ? 1 : -1;

    const [books, total] = await Promise.all([
      Book.find(query).sort(sortOption).skip(skip).limit(limitNum),
      Book.countDocuments(query)
    ]);

    // Distinct categories for quick filtering in UI
    const categories = await Book.distinct('category');

    return res.status(200).json({
      success: true,
      count: books.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      categories,
      books
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single book details
// @route   GET /api/books/:id
// @access  Private
const getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check active issues count for this book
    const activeIssuesCount = await Issue.countDocuments({
      book: book._id,
      status: { $in: ['issued', 'overdue'] }
    });

    return res.status(200).json({
      success: true,
      book: {
        ...book.toJSON(),
        activeIssuesCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new book
// @route   POST /api/books
// @access  Private (Admin, Librarian)
const createBook = async (req, res, next) => {
  try {
    const { title, author, isbn, category, publisher, totalCopies, location } = req.body;

    if (!title || !author || !isbn || totalCopies === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, author, ISBN, and total copies.'
      });
    }

    const total = parseInt(totalCopies, 10);
    if (isNaN(total) || total < 1) {
      return res.status(400).json({
        success: false,
        message: 'Total copies must be an integer of 1 or greater.'
      });
    }

    const cleanIsbn = isbn.trim().toUpperCase();

    // Check for existing book with same ISBN
    const existingBook = await Book.findOne({ isbn: cleanIsbn });
    if (existingBook) {
      return res.status(409).json({
        success: false,
        message: `Book with ISBN ${cleanIsbn} already exists: "${existingBook.title}"`
      });
    }

    const newBook = await Book.create({
      title: title.trim(),
      author: author.trim(),
      isbn: cleanIsbn,
      category: category ? category.trim() : 'General',
      publisher: publisher ? publisher.trim() : 'University Press',
      totalCopies: total,
      availableCopies: total, // Initially all copies are available
      location: location ? location.trim() : 'Main Library'
    });

    return res.status(201).json({
      success: true,
      message: 'Book added to catalog successfully',
      book: newBook
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update book details
// @route   PUT /api/books/:id
// @access  Private (Admin, Librarian)
const updateBook = async (req, res, next) => {
  try {
    const { title, author, isbn, category, publisher, totalCopies, location } = req.body;

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // If ISBN changed, verify uniqueness
    if (isbn && isbn.trim().toUpperCase() !== book.isbn) {
      const cleanIsbn = isbn.trim().toUpperCase();
      const duplicate = await Book.findOne({ isbn: cleanIsbn });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Another book with ISBN ${cleanIsbn} already exists.`
        });
      }
      book.isbn = cleanIsbn;
    }

    if (title) book.title = title.trim();
    if (author) book.author = author.trim();
    if (category) book.category = category.trim();
    if (publisher) book.publisher = publisher.trim();
    if (location !== undefined) book.location = location.trim();

    // Handle copy count changes safely
    if (totalCopies !== undefined) {
      const newTotal = parseInt(totalCopies, 10);
      if (isNaN(newTotal) || newTotal < 1) {
        return res.status(400).json({
          success: false,
          message: 'Total copies must be at least 1'
        });
      }

      // Check how many copies are currently issued
      const currentlyIssued = await Issue.countDocuments({
        book: book._id,
        status: { $in: ['issued', 'overdue'] }
      });

      if (newTotal < currentlyIssued) {
        return res.status(400).json({
          success: false,
          message: `Cannot decrease total copies to ${newTotal}. There are currently ${currentlyIssued} copies checked out.`
        });
      }

      book.totalCopies = newTotal;
      book.availableCopies = newTotal - currentlyIssued;
    }

    await book.save();

    return res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      book
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private (Admin, Librarian)
const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Prevent deletion if copies are currently borrowed
    const activeIssues = await Issue.countDocuments({
      book: book._id,
      status: { $in: ['issued', 'overdue'] }
    });

    if (activeIssues > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete "${book.title}". There are ${activeIssues} copies currently issued to students.`
      });
    }

    await Book.findByIdAndDelete(book._id);

    return res.status(200).json({
      success: true,
      message: `Book "${book.title}" was removed from the catalog.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};
