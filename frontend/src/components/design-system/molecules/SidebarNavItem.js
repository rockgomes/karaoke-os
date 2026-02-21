import React from 'react';
import './SidebarNavItem.css';

/**
 * SidebarNavItem Component
 * 
 * Maps to .pen components:
 * - Default: EhDoo
 * - Active: umU5Z
 */
const SidebarNavItem = ({
  icon,
  label,
  active = false,
  onClick,
  className = '',
  ...props
}) => {
  const baseClass = 'ds-sidebar-nav-item';
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
      {active && <span className={`${baseClass}__bar`} aria-hidden="true" />}
      <span className={`${baseClass}__icon`} aria-hidden="true">
        {icon}
      </span>
      <span className={`${baseClass}__label`}>{label}</span>
    </button>
  );
};

export default SidebarNavItem;
