import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
  Divider,
} from "@heroui/react";
import GenrePills from "./GenrePills";

const SongModal = ({ song, isOpen, onClose }) => {
  const [relatedSongs, setRelatedSongs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && song) {
      fetchRelatedSongs();
    }
  }, [isOpen, song]);

  const fetchRelatedSongs = async () => {
    if (!song?.artist || !song?.library_id) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `/api/libraries/${song.library_id}/songs/artist/${encodeURIComponent(
          song.artist
        )}`
      );
      // Filter out the current song from related songs
      const related = response.data.filter((s) => s.id !== song.id);
      setRelatedSongs(related);
    } catch (err) {
      console.error("Failed to fetch related songs:", err);
      setRelatedSongs([]);
    } finally {
      setLoading(false);
    }
  };

  if (!song) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[90vh]",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold">{song.title}</h2>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold min-w-[100px]">Artist:</span>
                <span>{song.artist}</span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-[100px]">Genre:</span>
                <GenrePills genres={song.genre} />
              </div>

              {song.duration && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold min-w-[100px]">Duration:</span>
                  <span>⏱️ {song.duration}</span>
                </div>
              )}

              {song.year && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold min-w-[100px]">Year:</span>
                  <span>📅 {song.year}</span>
                </div>
              )}

              {song.album && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold min-w-[100px]">Album:</span>
                  <span>💿 {song.album}</span>
                </div>
              )}
            </div>

            <Divider />

            {/* Related Songs Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                More songs by {song.artist}
              </h3>

              {loading ? (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" />
                  <span className="ml-2">Loading related songs...</span>
                </div>
              ) : relatedSongs.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {relatedSongs.map((relatedSong) => (
                    <div
                      key={relatedSong.id}
                      className="p-3 rounded-lg border border-default-200 hover:border-primary transition-colors"
                    >
                      <h4 className="font-semibold">{relatedSong.title}</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {relatedSong.genre && (
                          <GenrePills genres={relatedSong.genre} />
                        )}
                        {relatedSong.duration && (
                          <span className="text-xs text-default-500">
                            ⏱️ {relatedSong.duration}
                          </span>
                        )}
                        {relatedSong.year && (
                          <span className="text-xs text-default-500">
                            📅 {relatedSong.year}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-default-500 italic">
                  No other songs by {song.artist} available.
                </div>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" variant="flat" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SongModal;
