import React from 'react';
import './BottomNavItem.css';

/**
 * BottomNavItem Component
 * 
 * Maps to .pen components:
 * - Default: cnNIE
 * - Active: u5rJ7
 */
const BottomNavItem = ({
  icon,
  label,
  active = false,
  onClick,
  className = '',
  ...props
}) => {
  const baseClass = 'ds-bottom-nav-item';
  const activeClass = active ? `${baseClass}--active` : '';
  const classes = [baseClass, activeClass, className].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      {...props}
    >
      <span className={`${baseClass}__icon`} aria-hidden="true">
        {icon}
      </span>
      <span className={`${baseClass}__label`}>{label}</span>
    </button>
  );
};

export default BottomNavItem;
