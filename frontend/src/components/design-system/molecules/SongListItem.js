import React from 'react';
import './SongListItem.css';

/**
 * SongListItem Component
 * 
 * Maps to .pen component: hkRlf
 * Desktop song row with title, artist, duration, and tags
 * 
 * @param {Object} props
 * @param {string} props.title - Song title
 * @param {string} props.artist - Artist name
 * @param {string} props.duration - Song duration
 * @param {Array<React.ReactNode>} props.tags - Array of tag elements
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 */
const SongListItem = ({
  title,
  artist,
  duration,
  tags = [],
  onClick,
  className = '',
  ...props
}) => {
  const baseClass = 'ds-song-list-item';
  const clickableClass = onClick ? `${baseClass}--clickable` : '';
  const classes = [baseClass, clickableClass, className].filter(Boolean).join(' ');

  const metaText = duration ? `${artist}  •  ${duration}` : artist;

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
      <div className={`${baseClass}__info`}>
        <h3 className={`${baseClass}__title`}>{title}</h3>
        <p className={`${baseClass}__meta`}>{metaText}</p>
        {tags.length > 0 && (
          <div className={`${baseClass}__tags`}>
            {tags}
          </div>
        )}
      </div>
    </div>
  );
};

export default SongListItem;
