import React from 'react';
import './SearchBar.css';

/**
 * SearchBar Component
 * 
 * Maps to .pen component: h8nQG
 * 
 * @param {Object} props
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.value - Search value
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onClear - Clear button handler
 * @param {string} props.className - Additional CSS classes
 */
const SearchBar = ({
  placeholder = 'Search...',
  value = '',
  onChange,
  onClear,
  className = '',
  ...props
}) => {
  const baseClass = 'ds-searchbar';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  return (
    <div className={classes}>
      <span className={`${baseClass}__icon`} aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </span>
      <input
        type="text"
        className={`${baseClass}__input`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
      {value && (
        <button
          type="button"
          className={`${baseClass}__clear`}
          onClick={handleClear}
          aria-label="Clear search"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
