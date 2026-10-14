const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty']
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'General'
    },
    publisher: {
      type: String,
      trim: true,
      default: 'University Press'
    },
    totalCopies: {
      type: Number,
      required: [true, 'Total copies count is required'],
      min: [1, 'Total copies must be at least 1']
    },
    availableCopies: {
      type: Number,
      required: [true, 'Available copies count is required'],
      min: [0, 'Available copies cannot be negative']
    },
    location: {
      type: String,
      trim: true,
      default: 'Main Shelf'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for high performance searching
bookSchema.index({ title: 'text', author: 'text', category: 'text' });
bookSchema.index({ category: 1 });

// Validate that availableCopies does not exceed totalCopies
bookSchema.pre('validate', function () {
  if (this.totalCopies !== undefined && this.availableCopies !== undefined) {
    if (this.availableCopies > this.totalCopies) {
      this.invalidate('availableCopies', 'Available copies cannot exceed total copies');
    }
  }
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
