import React from 'react';
import './SearchResultItem.css';

/**
 * SearchResultItem Component
 * 
 * Maps to .pen component: fKO9U
 * Search result with title, meta info, and chevron
 */
const SearchResultItem = ({
  title,
  meta,
  onClick,
  className = '',
  ...props
}) => {
  const baseClass = 'ds-search-result-item';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(e);
        }
      }}
      {...props}
    >
      <div className={`${baseClass}__info`}>
        <h3 className={`${baseClass}__title`}>{title}</h3>
        <p className={`${baseClass}__meta`}>{meta}</p>
      </div>
      <span className={`${baseClass}__chevron`} aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </span>
    </div>
  );
};

export default SearchResultItem;
