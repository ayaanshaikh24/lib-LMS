import React from 'react';

const StatCard = ({ label, value, subtext, icon: Icon, color = 'blue' }) => {
  return (
    <div className="stat-card">
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {subtext && <div className="stat-subtext">{subtext}</div>}
      </div>
      {Icon && (
        <div className={`stat-icon-wrapper stat-icon-${color}`}>
          <Icon size={22} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
