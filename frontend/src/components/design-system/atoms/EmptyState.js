import React from 'react';
import './EmptyState.css';

/**
 * EmptyState Component
 * 
 * Maps to .pen component: aIQgN
 * Displays when no content is available
 */
const EmptyState = ({
  icon,
  title,
  description,
  className = '',
  ...props
}) => {
  const baseClass = 'ds-empty-state';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {icon && (
        <span className={`${baseClass}__icon`} aria-hidden="true">
          {icon}
        </span>
      )}
      <h3 className={`${baseClass}__title`}>{title}</h3>
      {description && (
        <p className={`${baseClass}__description`}>{description}</p>
      )}
    </div>
  );
};

export default EmptyState;
