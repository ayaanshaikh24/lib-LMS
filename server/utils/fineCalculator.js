/**
 * Pure utility function to calculate overdue fines for college library loans.
 *
 * Designed with distinct control branches for white-box testing,
 * cyclomatic complexity analysis, and strict boundary validation.
 *
 * @param {Date|string|number} dueDate - Scheduled due date
 * @param {Date|string|number} [returnDate] - Actual return date (defaults to current date)
 * @param {number} [finePerDay=5] - Fine rate in currency units per day
 * @returns {{ daysOverdue: number, fineAmount: number, isOverdue: boolean }}
 */
function calculateOverdueFine(dueDate, returnDate = new Date(), finePerDay = 5) {
  // Node 1: Validation of input parameters
  if (!dueDate) {
    throw new Error('Due date is required');
  }

  const due = new Date(dueDate);
  const returned = new Date(returnDate);

  // Node 2: Check for valid date formats
  if (isNaN(due.getTime()) || isNaN(returned.getTime())) {
    throw new Error('Invalid date provided');
  }

  const rate = Number(finePerDay);
  // Node 3: Rate validity check
  if (isNaN(rate) || rate < 0) {
    throw new Error('Fine rate per day must be a non-negative number');
  }

  // Node 4: Normalize to calendar dates (midnight) to ensure integer day calculations
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const returnMidnight = new Date(returned.getFullYear(), returned.getMonth(), returned.getDate()).getTime();

  const diffMs = returnMidnight - dueMidnight;

  // Node 5: Non-overdue boundary check (returned on or before due date)
  if (diffMs <= 0) {
    return {
      daysOverdue: 0,
      fineAmount: 0,
      isOverdue: false
    };
  }

  // Node 6: Calculate full overdue days
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const daysOverdue = Math.floor(diffMs / MS_PER_DAY);

  // Node 7: Boundary check for fractional sub-day cases
  if (daysOverdue <= 0) {
    return {
      daysOverdue: 0,
      fineAmount: 0,
      isOverdue: false
    };
  }

  // Node 8: Compute fine amount and return result
  const fineAmount = daysOverdue * rate;

  return {
    daysOverdue,
    fineAmount,
    isOverdue: true
  };
}

module.exports = { calculateOverdueFine };
