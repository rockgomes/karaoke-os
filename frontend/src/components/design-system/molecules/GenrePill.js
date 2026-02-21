import React from 'react';
import './GenrePill.css';

/**
 * GenrePill Component
 * 
 * Maps to .pen components:
 * - Default: D2r3X
 * - Active: kjlX1
 */
const GenrePill = ({
  label,
  active = false,
  onClick,
  className = '',
  ...props
}) => {
  const baseClass = 'ds-genre-pill';
  const activeClass = active ? `${baseClass}--active` : '';
  const classes = [baseClass, activeClass, className].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      aria-pressed={active}
      {...props}
    >
      {label}
    </button>
  );
};

export default GenrePill;
