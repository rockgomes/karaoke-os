import React from 'react';
import './FilterPill.css';

/**
 * FilterPill Component
 * 
 * Maps to .pen component: as99c
 * Dropdown filter button with label and chevron
 */
const FilterPill = ({
  label,
  onClick,
  className = '',
  ...props
}) => {
  const baseClass = 'ds-filter-pill';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      {...props}
    >
      <span className={`${baseClass}__label`}>{label}</span>
      <span className={`${baseClass}__chevron`} aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    </button>
  );
};

export default FilterPill;
