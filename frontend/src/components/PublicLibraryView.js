import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  SearchBar,
  GenrePill,
  MobileSongCard,
  EmptyState,
  SkeletonCard,
} from "./design-system";
import SongModal from "./SongModal";
import "./PublicLibraryView.css";

const PublicLibraryView = () => {
  const { slug } = useParams();
  const [library, setLibrary] = useState(null);
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [genres, setGenres] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedArtist, setSelectedArtist] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [orderBy, setOrderBy] = useState("artist");

  // Modal states
  const [selectedSong, setSelectedSong] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchLibrary();
  }, [slug]);

  useEffect(() => {
    if (library) {
      fetchSongs();
      fetchGenres();
      fetchArtists();
    }
  }, [library]);

  const fetchLibrary = async () => {
    try {
      const response = await axios.get(`/api/public/libraries/${slug}`);
      setLibrary(response.data);
    } catch (err) {
      setError("Library not found");
      setLoading(false);
    }
  };

  const fetchSongs = async () => {
    try {
      const response = await axios.get(`/api/public/libraries/${slug}/songs`);
      setSongs(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch songs");
      setLoading(false);
    }
  };

  const fetchGenres = async () => {
    try {
      const response = await axios.get(`/api/public/libraries/${slug}/genres`);
      setGenres(response.data);
    } catch (err) {
      console.error("Failed to fetch genres:", err);
    }
  };

  const fetchArtists = async () => {
    try {
      const response = await axios.get(`/api/public/libraries/${slug}/artists`);
      setArtists(response.data);
    } catch (err) {
      console.error("Failed to fetch artists:", err);
    }
  };

  useEffect(() => {
    let filtered = songs;

    if (selectedGenre) {
      filtered = filtered.filter((song) =>
        song.genre.toLowerCase().includes(selectedGenre.toLowerCase()),
      );
    }

    if (selectedArtist) {
      filtered = filtered.filter((song) =>
        song.artist.toLowerCase().includes(selectedArtist.toLowerCase()),
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (song) =>
          song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          song.artist.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    filtered = [...filtered].sort((a, b) => {
      if (orderBy === "artist") {
        if (a.artist.toLowerCase() === b.artist.toLowerCase()) {
          return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        }
        return a.artist.toLowerCase().localeCompare(b.artist.toLowerCase());
      } else {
        return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
      }
    });

    setFilteredSongs(filtered);
  }, [songs, selectedGenre, selectedArtist, searchTerm, orderBy]);

  const clearFilters = () => {
    setSelectedGenre("");
    setSelectedArtist("");
    setSearchTerm("");
  };

  const handleSongClick = (song) => {
    setSelectedSong(song);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSong(null);
  };

  if (loading) {
    return (
      <div className="public-library">
        <div className="public-library__content">
          <div className="public-library__skeleton">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-library">
        <div className="public-library__content">
          <EmptyState
            icon={
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            }
            title={error}
            description="Please check the URL and try again"
          />
        </div>
      </div>
    );
  }

  if (!library) {
    return null;
  }

  const uniqueGenres = ["All", ...new Set(genres)];

  return (
    <div className="public-library">
      {/* Header */}
      <div className="public-library__header">
        <div className="public-library__venue">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <div>
            <h1 className="public-library__venue-name">{library.name}</h1>
            <p className="public-library__venue-subtitle">
              Karaoke Song Library
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="public-library__search">
        <SearchBar
          placeholder="Search songs or artists..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm("")}
        />
      </div>

      {/* Genre Pills */}
      <div className="public-library__genres">
        {uniqueGenres.map((genre) => (
          <GenrePill
            key={genre}
            label={genre}
            active={genre === "All" ? !selectedGenre : selectedGenre === genre}
            onClick={() => setSelectedGenre(genre === "All" ? "" : genre)}
          />
        ))}
      </div>

      {/* Results Count */}
      {searchTerm || selectedGenre ? (
        <div className="public-library__results-count">
          {filteredSongs.length} {filteredSongs.length === 1 ? "song" : "songs"}{" "}
          found
        </div>
      ) : null}

      {/* Song List */}
      <div className="public-library__content">
        {filteredSongs.length > 0 ? (
          <div className="public-library__songs">
            {filteredSongs.map((song) => (
              <MobileSongCard
                key={song.id}
                title={song.title}
                artist={song.artist}
                onClick={() => handleSongClick(song)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            }
            title="No songs found"
            description={
              songs.length === 0
                ? "This library doesn't have any songs yet"
                : "Try adjusting your search or filters"
            }
          />
        )}
      </div>

      {/* Song Modal */}
      <SongModal
        song={selectedSong}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default PublicLibraryView;
