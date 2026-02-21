import React from 'react';
import './SearchTypeSelector.css';

/**
 * SearchTypeSelector Component
 * 
 * Maps to .pen component: glLNk
 * Toggle between Artists and Songs search
 */
const SearchTypeSelector = ({
  options = [],
  activeOption,
  onChange,
  className = '',
  ...props
}) => {
  const baseClass = 'ds-search-type-selector';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  return (
    <div className={classes} role="tablist" {...props}>
      {options.map((option) => {
        const isActive = option.value === activeOption;
        const buttonClass = isActive
          ? `${baseClass}__button ${baseClass}__button--active`
          : `${baseClass}__button`;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={buttonClass}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default SearchTypeSelector;
