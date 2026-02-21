import React from 'react';
import './MobileSongCard.css';

/**
 * MobileSongCard Component
 * 
 * Maps to .pen component: g86h6
 * Mobile song card with cover art placeholder, title, and artist
 */
const MobileSongCard = ({
  title,
  artist,
  coverUrl,
  onClick,
  className = '',
  ...props
}) => {
  const baseClass = 'ds-mobile-song-card';
  const clickableClass = onClick ? `${baseClass}--clickable` : '';
  const classes = [baseClass, clickableClass, className].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      } : undefined}
      {...props}
    >
      <div className={`${baseClass}__cover`}>
        {coverUrl && <img src={coverUrl} alt="" />}
      </div>
      <div className={`${baseClass}__info`}>
        <h3 className={`${baseClass}__title`}>{title}</h3>
        <p className={`${baseClass}__artist`}>{artist}</p>
      </div>
    </div>
  );
};

export default MobileSongCard;
