import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import GenrePills from './GenrePills';
import './SongModal.css';

const SongModal = ({ song, isOpen, onClose }) => {
  const [relatedSongs, setRelatedSongs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && song) {
      fetchRelatedSongs();
    }
  }, [isOpen, song]);

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

  const fetchRelatedSongs = async () => {
    if (!song?.artist || !song?.library_id) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/libraries/${song.library_id}/songs/artist/${encodeURIComponent(song.artist)}`
      );
      setRelatedSongs(response.data.filter((s) => s.id !== song.id));
    } catch (err) {
      console.error('Failed to fetch related songs:', err);
      setRelatedSongs([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !song) return null;

  return ReactDOM.createPortal(
    <div className="song-modal__backdrop" onClick={onClose}>
      <div
        className="song-modal__panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="song-modal-title"
      >
        <div className="song-modal__header">
          <h2 className="song-modal__title" id="song-modal-title">{song.title}</h2>
          <button className="song-modal__close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="song-modal__body">
          <div className="song-modal__fields">
            <div className="song-modal__field">
              <span className="song-modal__field-label">Artist:</span>
              <span className="song-modal__field-value">{song.artist}</span>
            </div>
            <div className="song-modal__field">
              <span className="song-modal__field-label">Genre:</span>
              <GenrePills genres={song.genre} />
            </div>
            {song.duration && (
              <div className="song-modal__field">
                <span className="song-modal__field-label">Duration:</span>
                <span className="song-modal__field-value">⏱️ {song.duration}</span>
              </div>
            )}
            {song.year && (
              <div className="song-modal__field">
                <span className="song-modal__field-label">Year:</span>
                <span className="song-modal__field-value">📅 {song.year}</span>
              </div>
            )}
            {song.album && (
              <div className="song-modal__field">
                <span className="song-modal__field-label">Album:</span>
                <span className="song-modal__field-value">💿 {song.album}</span>
              </div>
            )}
          </div>

          <hr className="song-modal__divider" />

          <div className="song-modal__related">
            <h3 className="song-modal__related-title">More songs by {song.artist}</h3>
            {loading ? (
              <div className="song-modal__loading">
                <span className="song-modal__spinner" aria-hidden="true" />
                Loading related songs...
              </div>
            ) : relatedSongs.length > 0 ? (
              <div className="song-modal__related-list">
                {relatedSongs.map((relatedSong) => (
                  <div key={relatedSong.id} className="song-modal__related-item">
                    <h4 className="song-modal__related-item-title">{relatedSong.title}</h4>
                    <div className="song-modal__related-item-meta">
                      {relatedSong.genre && <GenrePills genres={relatedSong.genre} />}
                      {relatedSong.duration && (
                        <span className="song-modal__related-item-detail">⏱️ {relatedSong.duration}</span>
                      )}
                      {relatedSong.year && (
                        <span className="song-modal__related-item-detail">📅 {relatedSong.year}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="song-modal__related-empty">
                No other songs by {song.artist} available.
              </p>
            )}
          </div>
        </div>

        <div className="song-modal__footer">
          <button className="song-modal__close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SongModal;
