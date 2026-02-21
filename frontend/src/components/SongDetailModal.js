import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { Badge } from './design-system';
import './SongDetailModal.css';

const SongDetailModal = ({ song, isOpen, onClose, onEdit, onDelete }) => {
  if (!song) return null;

  const aiFields = [];
  if (song.genre) aiFields.push('Genre');
  if (song.duration) aiFields.push('Duration');
  if (song.year) aiFields.push('Year');
  if (song.album) aiFields.push('Album');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Song Details
        </ModalHeader>
        <ModalBody>
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
        </ModalBody>
        <ModalFooter className="justify-center">
          <Button variant="flat" onPress={() => {
            onClose();
            onEdit(song);
          }}>
            Edit Song
          </Button>
          <Button color="danger" variant="flat" onPress={() => {
            if (window.confirm(`Are you sure you want to delete "${song.title}"?`)) {
              onDelete(song.id);
              onClose();
            }
          }}>
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SongDetailModal;
