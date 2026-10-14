const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book reference is required']
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required']
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Librarian/Admin reference is required']
    },
    issueDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    returnDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['issued', 'returned', 'overdue'],
      default: 'issued',
      required: true
    },
    fineAmount: {
      type: Number,
      default: 0,
      min: [0, 'Fine amount cannot be negative']
    },
    finePaid: {
      type: Boolean,
      default: false
    },
    paidAt: {
      type: Date
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
issueSchema.index({ student: 1, status: 1 });
issueSchema.index({ book: 1, status: 1 });
issueSchema.index({ dueDate: 1 });
issueSchema.index({ issueDate: 1 });
issueSchema.index({ status: 1 });

const Issue = mongoose.model('Issue', issueSchema);

module.exports = Issue;
