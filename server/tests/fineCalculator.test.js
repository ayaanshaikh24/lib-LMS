const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { calculateOverdueFine } = require('../utils/fineCalculator');

describe('Fine Calculator Utility Tests', () => {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  test('returns 0 fine and isOverdue: false when book is returned before due date', () => {
    const due = new Date('2026-05-15');
    const returned = new Date('2026-05-10'); // 5 days early

    const result = calculateOverdueFine(due, returned, 5);

    assert.equal(result.isOverdue, false);
    assert.equal(result.daysOverdue, 0);
    assert.equal(result.fineAmount, 0);
  });

  test('returns 0 fine and isOverdue: false when book is returned on exact due date', () => {
    const due = new Date('2026-05-15T12:00:00');
    const returned = new Date('2026-05-15T18:00:00'); // same calendar day

    const result = calculateOverdueFine(due, returned, 5);

    assert.equal(result.isOverdue, false);
    assert.equal(result.daysOverdue, 0);
    assert.equal(result.fineAmount, 0);
  });

  test('calculates correct fine for 1 day overdue (boundary value)', () => {
    const due = new Date('2026-05-15');
    const returned = new Date('2026-05-16');

    const result = calculateOverdueFine(due, returned, 5);

    assert.equal(result.isOverdue, true);
    assert.equal(result.daysOverdue, 1);
    assert.equal(result.fineAmount, 5);
  });

  test('calculates correct fine for multiple days overdue with default rate', () => {
    const due = new Date('2026-05-01');
    const returned = new Date('2026-05-11'); // 10 days overdue

    const result = calculateOverdueFine(due, returned); // default rate = 5

    assert.equal(result.isOverdue, true);
    assert.equal(result.daysOverdue, 10);
    assert.equal(result.fineAmount, 50);
  });

  test('calculates fine correctly with custom non-zero rate', () => {
    const due = new Date('2026-05-01');
    const returned = new Date('2026-05-08'); // 7 days overdue
    const customRate = 12.5;

    const result = calculateOverdueFine(due, returned, customRate);

    assert.equal(result.isOverdue, true);
    assert.equal(result.daysOverdue, 7);
    assert.equal(result.fineAmount, 87.5);
  });

  test('calculates fine correctly with 0 rate (free grace policy)', () => {
    const due = new Date('2026-05-01');
    const returned = new Date('2026-05-10');

    const result = calculateOverdueFine(due, returned, 0);

    assert.equal(result.isOverdue, true);
    assert.equal(result.daysOverdue, 9);
    assert.equal(result.fineAmount, 0);
  });

  test('throws error when due date is missing or null', () => {
    assert.throws(
      () => calculateOverdueFine(null, new Date()),
      /Due date is required/
    );
  });

  test('throws error when an invalid date string is provided', () => {
    assert.throws(
      () => calculateOverdueFine('not-a-valid-date', new Date()),
      /Invalid date provided/
    );
    assert.throws(
      () => calculateOverdueFine(new Date(), 'corrupted-date'),
      /Invalid date provided/
    );
  });

  test('throws error when fine rate is negative', () => {
    assert.throws(
      () => calculateOverdueFine(new Date('2026-05-01'), new Date('2026-05-05'), -5),
      /Fine rate per day must be a non-negative number/
    );
  });
});
