import React from 'react';
import './MobileBottomNav.css';

/**
 * MobileBottomNav Component
 * 
 * Maps to .pen component: SCvrn
 * Dark bottom navigation bar for mobile with 3 items
 */
const MobileBottomNav = ({
  items = [],
  className = '',
  ...props
}) => {
  const baseClass = 'ds-mobile-bottom-nav';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  return (
    <nav className={classes} {...props}>
      {items.map((item, index) => (
        <React.Fragment key={index}>{item}</React.Fragment>
      ))}
    </nav>
  );
};

export default MobileBottomNav;
