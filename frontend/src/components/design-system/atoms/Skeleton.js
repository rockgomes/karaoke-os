import React from 'react';
import './Skeleton.css';

/**
 * Skeleton Component
 * 
 * Maps to .pen components:
 * - Line: wiIYv
 * - Card: CNuKx
 */
export const SkeletonLine = ({ width = 200, className = '', ...props }) => {
  const baseClass = 'ds-skeleton-line';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      style={{ width: typeof width === 'number' ? `${width}px` : width }}
      aria-busy="true"
      aria-live="polite"
      {...props}
    />
  );
};

export const SkeletonCard = ({ className = '', ...props }) => {
  const baseClass = 'ds-skeleton-card';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  return (
    <div className={classes} aria-busy="true" aria-live="polite" {...props}>
      <div className={`${baseClass}__thumb`} />
      <div className={`${baseClass}__text`}>
        <div className={`${baseClass}__line1`} />
        <div className={`${baseClass}__line2`} />
      </div>
    </div>
  );
};

const Skeleton = {
  Line: SkeletonLine,
  Card: SkeletonCard,
};

export default Skeleton;
