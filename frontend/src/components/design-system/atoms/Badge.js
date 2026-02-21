import React from 'react';
import './Badge.css';

/**
 * Badge Component
 * 
 * Maps to .pen components:
 * - Default: w3iUh
 * - AI variant: Oew16
 * 
 * @param {Object} props
 * @param {'default' | 'ai'} props.variant - Badge style variant
 * @param {React.ReactNode} props.icon - Optional icon element
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} props.className - Additional CSS classes
 */
const Badge = ({
  variant = 'default',
  icon,
  children,
  className = '',
  ...props
}) => {
  const baseClass = 'ds-badge';
  const variantClass = `ds-badge--${variant}`;
  
  const classes = [baseClass, variantClass, className].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {icon && (
        <span className="ds-badge__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="ds-badge__label">{children}</span>
    </span>
  );
};

export default Badge;
