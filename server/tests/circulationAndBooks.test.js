const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const Book = require('../models/Book');
const User = require('../models/User');
const Issue = require('../models/Issue');
const { calculateOverdueFine } = require('../utils/fineCalculator');

describe('Database Integration: Books & Circulation Operations', () => {
  let testStudent;
  let testLibrarian;
  let testBook;

  before(async () => {
    await connectDB();

    // Create test librarian
    testLibrarian = await User.create({
      name: 'Test Librarian',
      email: `testlib_${Date.now()}@test.com`,
      password: 'Password@123',
      role: 'librarian'
    });

    // Create test student
    testStudent = await User.create({
      name: 'Test Student',
      email: `teststudent_${Date.now()}@test.com`,
      password: 'Password@123',
      role: 'student',
      studentId: `TEST_ID_${Date.now()}`,
      department: 'Computer Science',
      isActive: true
    });
  });

  after(async () => {
    // Clean up test documents
    if (testStudent) await User.deleteOne({ _id: testStudent._id });
    if (testLibrarian) await User.deleteOne({ _id: testLibrarian._id });
    if (testBook) await Book.deleteOne({ _id: testBook._id });
    await Issue.deleteMany({ student: testStudent?._id });
    await disconnectDB();
  });

  test('successfully creates a book with valid attributes', async () => {
    const isbn = `TEST-ISBN-${Date.now()}`;
    testBook = await Book.create({
      title: 'Distributed Systems Principles',
      author: 'Andrew S. Tanenbaum',
      isbn,
      category: 'Computer Science',
      totalCopies: 1, // Only 1 copy to test availability exhaustion
      availableCopies: 1
    });

    assert.equal(testBook.title, 'Distributed Systems Principles');
    assert.equal(testBook.totalCopies, 1);
    assert.equal(testBook.availableCopies, 1);
  });

  test('rejects creating duplicate book with same ISBN', async () => {
    await assert.rejects(
      async () => {
        await Book.create({
          title: 'Duplicate Book Title',
          author: 'Different Author',
          isbn: testBook.isbn, // Same ISBN
          totalCopies: 2,
          availableCopies: 2
        });
      },
      (err) => {
        assert.ok(err.code === 11000 || err.name === 'MongoServerError');
        return true;
      }
    );
  });

  test('rejects invalid copy count where availableCopies exceeds totalCopies', async () => {
    const invalidBook = new Book({
      title: 'Invalid Copies Test',
      author: 'Some Author',
      isbn: `INVALID-${Date.now()}`,
      totalCopies: 3,
      availableCopies: 5 // Greater than total copies
    });

    await assert.rejects(
      async () => {
        await invalidBook.validate();
      },
      /Available copies cannot exceed total copies/
    );
  });

  test('issues available book and decrements availableCopies to 0', async () => {
    // Atomically decrement
    const updated = await Book.findOneAndUpdate(
      { _id: testBook._id, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { returnDocument: 'after' }
    );

    assert.ok(updated);
    assert.equal(updated.availableCopies, 0);

    const issueRecord = await Issue.create({
      book: testBook._id,
      student: testStudent._id,
      issuedBy: testLibrarian._id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'issued'
    });

    assert.ok(issueRecord._id);
    assert.equal(issueRecord.status, 'issued');
  });

  test('prevents issuing book when availableCopies is 0 (Out of stock)', async () => {
    // Attempt atomic decrement when availableCopies > 0
    const failedUpdate = await Book.findOneAndUpdate(
      { _id: testBook._id, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { returnDocument: 'after' }
    );

    // Should return null because availableCopies is 0
    assert.equal(failedUpdate, null);
  });

  test('returns book, calculates fine and increments availableCopies', async () => {
    const activeIssue = await Issue.findOne({
      book: testBook._id,
      student: testStudent._id,
      status: 'issued'
    });
    assert.ok(activeIssue);

    // Simulate return on due date
    const returnDate = new Date();
    const fineResult = calculateOverdueFine(activeIssue.dueDate, returnDate, 5);

    activeIssue.returnDate = returnDate;
    activeIssue.status = 'returned';
    activeIssue.fineAmount = fineResult.fineAmount;
    activeIssue.finePaid = fineResult.fineAmount === 0;
    await activeIssue.save();

    // Increment available copies
    const restoredBook = await Book.findByIdAndUpdate(
      testBook._id,
      { $inc: { availableCopies: 1 } },
      { returnDocument: 'after' }
    );

    assert.equal(restoredBook.availableCopies, 1);
    assert.equal(activeIssue.status, 'returned');
    assert.equal(activeIssue.fineAmount, 0);
  });
});
