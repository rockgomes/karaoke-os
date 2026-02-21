import React from 'react';
import './Button.css';

/**
 * Button Component
 * 
 * Maps to .pen components:
 * - Primary: bgJRp
 * - Outline: 0ERfh
 * - Primary Hover: 4rORl
 * - Primary Disabled: zBWzY
 * - Outline Hover: scSlO
 * - Outline Disabled: OiakN
 * 
 * @param {Object} props
 * @param {'primary' | 'outline'} props.variant - Button style variant
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.loading - Loading state
 * @param {React.ReactNode} props.icon - Optional icon element
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler
 */
const Button = ({
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  children,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClass = 'ds-button';
  const variantClass = `ds-button--${variant}`;
  const disabledClass = disabled || loading ? 'ds-button--disabled' : '';
  const loadingClass = loading ? 'ds-button--loading' : '';
  
  const classes = [
    baseClass,
    variantClass,
    disabledClass,
    loadingClass,
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <button
      type={type}
      className={classes}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="ds-button__spinner" aria-hidden="true">
          <svg className="ds-button__spinner-icon" viewBox="0 0 24 24">
            <circle
              className="ds-button__spinner-circle"
              cx="12"
              cy="12"
              r="10"
              fill="none"
              strokeWidth="3"
            />
          </svg>
        </span>
      )}
      {!loading && icon && (
        <span className="ds-button__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="ds-button__label">{children}</span>
    </button>
  );
};

export default Button;
