import React from 'react';

const Badge = ({ status, text }) => {
  let badgeClass = 'badge-neutral';
  let display = text || status;

  switch (status?.toLowerCase()) {
    case 'issued':
      badgeClass = 'badge-info';
      display = display || 'Issued';
      break;
    case 'returned':
      badgeClass = 'badge-success';
      display = display || 'Returned';
      break;
    case 'overdue':
      badgeClass = 'badge-danger';
      display = display || 'Overdue';
      break;
    case 'active':
      badgeClass = 'badge-success';
      display = display || 'Active';
      break;
    case 'inactive':
    case 'deactivated':
      badgeClass = 'badge-danger';
      display = display || 'Inactive';
      break;
    case 'available':
      badgeClass = 'badge-success';
      display = display || 'Available';
      break;
    case 'out_of_stock':
      badgeClass = 'badge-warning';
      display = display || 'Out of Stock';
      break;
    case 'paid':
      badgeClass = 'badge-success';
      display = display || 'Paid';
      break;
    case 'pending':
      badgeClass = 'badge-danger';
      display = display || 'Pending';
      break;
    default:
      badgeClass = 'badge-neutral';
  }

  return <span className={`badge ${badgeClass}`}>{display}</span>;
};

export default Badge;
