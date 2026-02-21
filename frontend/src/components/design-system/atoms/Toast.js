import React, { useEffect } from 'react';
import './Toast.css';

/**
 * Toast Component
 * 
 * Maps to .pen components:
 * - Success: Rqpy9
 * - Error: IPWiW
 * - Info: 1fyk0
 */
const Toast = ({
  variant = 'info',
  message,
  onClose,
  duration = 5000,
  className = '',
  ...props
}) => {
  const baseClass = 'ds-toast';
  const variantClass = `${baseClass}--${variant}`;
  const classes = [baseClass, variantClass, className].filter(Boolean).join(' ');

  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
      case 'error':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

  return (
    <div className={classes} role="alert" {...props}>
      <span className={`${baseClass}__icon`} aria-hidden="true">
        {getIcon()}
      </span>
      <span className={`${baseClass}__message`}>{message}</span>
      {onClose && (
        <button
          type="button"
          className={`${baseClass}__close`}
          onClick={onClose}
          aria-label="Close notification"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Toast;
