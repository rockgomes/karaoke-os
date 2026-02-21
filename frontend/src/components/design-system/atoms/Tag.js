import React from 'react';
import './Tag.css';

/**
 * Tag Component
 * 
 * Maps to .pen component: PAl4L
 * Used for genre tags and other categorical labels
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Tag content
 * @param {string} props.className - Additional CSS classes
 */
const Tag = ({
  children,
  className = '',
  ...props
}) => {
  const classes = ['ds-tag', className].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};

export default Tag;
