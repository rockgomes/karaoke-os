import React, { forwardRef } from 'react';
import './Input.css';

/**
 * Input Component
 * 
 * Maps to .pen components:
 * - Text: K3n9d
 * - Textarea: ODXZ5
 * - Focus: 77Gbu
 * - Error: 0E1yE
 * 
 * @param {Object} props
 * @param {'text' | 'email' | 'password' | 'number' | 'textarea'} props.type - Input type
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {boolean} props.error - Error state
 * @param {string} props.errorMessage - Error message to display
 * @param {React.ReactNode} props.icon - Optional icon element
 * @param {boolean} props.clearable - Show clear button when value exists
 * @param {Function} props.onClear - Clear button handler
 * @param {string} props.className - Additional CSS classes
 */
const Input = forwardRef(({
  type = 'text',
  placeholder = '',
  value = '',
  onChange,
  error = false,
  errorMessage = '',
  icon,
  clearable = false,
  onClear,
  className = '',
  disabled = false,
  ...props
}, ref) => {
  const isTextarea = type === 'textarea';
  const baseClass = 'ds-input';
  const errorClass = error ? 'ds-input--error' : '';
  const disabledClass = disabled ? 'ds-input--disabled' : '';
  const textareaClass = isTextarea ? 'ds-input--textarea' : '';
  
  const wrapperClasses = [
    `${baseClass}-wrapper`,
    errorClass,
    disabledClass,
    textareaClass,
    className
  ].filter(Boolean).join(' ');

  const showClearButton = clearable && value && !disabled;

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  const InputElement = isTextarea ? 'textarea' : 'input';

  return (
    <div className={wrapperClasses}>
      <div className={`${baseClass}-container`}>
        {icon && !error && (
          <span className={`${baseClass}__icon`} aria-hidden="true">
            {icon}
          </span>
        )}
        {error && errorMessage && (
          <span className={`${baseClass}__icon ${baseClass}__icon--error`} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
        )}
        <InputElement
          ref={ref}
          type={isTextarea ? undefined : type}
          className={baseClass}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={error}
          aria-describedby={error && errorMessage ? `${props.id}-error` : undefined}
          {...props}
        />
        {showClearButton && (
          <button
            type="button"
            className={`${baseClass}__clear`}
            onClick={handleClear}
            aria-label="Clear input"
            tabIndex={-1}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      {error && errorMessage && (
        <span 
          id={`${props.id}-error`}
          className={`${baseClass}__error-message`}
          role="alert"
        >
          {errorMessage}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
