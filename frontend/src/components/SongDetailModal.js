import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Badge, Button } from './design-system';
import './SongDetailModal.css';

const SongDetailModal = ({ song, isOpen, onClose, onEdit, onDelete }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !song) return null;

  const aiFields = [];
  if (song.genre) aiFields.push('Genre');
  if (song.duration) aiFields.push('Duration');
  if (song.year) aiFields.push('Year');
  if (song.album) aiFields.push('Album');

  return ReactDOM.createPortal(
    <div className="song-modal__backdrop" onClick={onClose}>
      <div
        className="song-modal__panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Song Details"
      >
        <div className="song-modal__header">
          <h2 className="song-modal__title">Song Details</h2>
          <button className="song-modal__close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="song-modal__body">
          <div className="song-detail">
            <div className="song-detail__header">
              <div className="song-detail__cover"></div>
              <div className="song-detail__title-section">
                <h3 className="song-detail__title">{song.title}</h3>
                <p className="song-detail__artist">
                  {song.artist}
                  {song.year && ` • ${song.year}`}
                </p>
              </div>
            </div>

            <div className="song-detail__metadata">
              <div className="song-detail__metadata-row">
                <span className="song-detail__label">Genre:</span>
                <span className="song-detail__value">{song.genre || '—'}</span>
              </div>
              <div className="song-detail__metadata-row">
                <span className="song-detail__label">Duration:</span>
                <span className="song-detail__value">{song.duration || '—'}</span>
              </div>
              <div className="song-detail__metadata-row">
                <span className="song-detail__label">Album:</span>
                <span className="song-detail__value">{song.album || '—'}</span>
              </div>
              {song.year && (
                <div className="song-detail__metadata-row">
                  <span className="song-detail__label">Year:</span>
                  <span className="song-detail__value">{song.year}</span>
                </div>
              )}
            </div>

            {aiFields.length > 0 && (
              <div className="song-detail__ai-section">
                <div className="song-detail__ai-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  AI-Enhanced Fields:
                </div>
                <div className="song-detail__ai-tags">
                  {aiFields.map(field => (
                    <Badge key={field} variant="ai" label={field} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="song-modal__footer">
          <Button variant="outline" onClick={() => { onClose(); onEdit(song); }}>
            Edit Song
          </Button>
          <Button
            variant="outline"
            className="song-modal__delete-btn"
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete "${song.title}"?`)) {
                onDelete(song.id);
                onClose();
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SongDetailModal;
