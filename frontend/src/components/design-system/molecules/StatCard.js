import React from 'react';
import './StatCard.css';

/**
 * StatCard Component
 * 
 * Maps to .pen component: TOfsA
 * Displays a statistic with label, value, and optional subtitle
 */
const StatCard = ({
  label,
  value,
  subtitle,
  className = '',
  ...props
}) => {
  const baseClass = 'ds-stat-card';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      <p className={`${baseClass}__label`}>{label}</p>
      <h2 className={`${baseClass}__value`}>{value}</h2>
      {subtitle && <p className={`${baseClass}__subtitle`}>{subtitle}</p>}
    </div>
  );
};

export default StatCard;
