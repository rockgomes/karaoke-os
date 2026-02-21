import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { HeadphonesIcon } from "@heroui/shared-icons";
import GenrePills from "./GenrePills";
import SongModal from "./SongModal";

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
        song.genre.toLowerCase().includes(selectedGenre.toLowerCase())
      );
    }

    if (selectedArtist) {
      filtered = filtered.filter((song) =>
        song.artist.toLowerCase().includes(selectedArtist.toLowerCase())
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (song) =>
          song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          song.artist.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="container">
        <div className="song-list">
          <p style={{ textAlign: "center", fontSize: "1.2rem" }}>
            Loading library...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="song-list">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  if (!library) {
    return null;
  }

  return (
    <div className="container">
      <div className="song-list">
        <div
          style={{
            textAlign: "center",
            marginBottom: "2rem",
            padding: "1.5rem",
            backgroundColor: "#f0f4ff",
            borderRadius: "8px",
          }}
        >
          <h1
            style={{
              margin: "0 0 0.5rem 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <HeadphonesIcon style={{ width: 24, height: 24 }} />
            {library.name}
          </h1>
          <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
            Public Karaoke Library
          </p>
        </div>

        {/* Filters */}
        <div className="filters">
          <div className="filter-group">
            <label>Search Songs:</label>
            <input
              type="text"
              placeholder="Search by title or artist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Filter by Genre:</label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
            >
              <option value="">All Genres</option>
              {genres.map((genre, index) => (
                <option key={index} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Filter by Artist:</label>
            <select
              value={selectedArtist}
              onChange={(e) => setSelectedArtist(e.target.value)}
            >
              <option value="">All Artists</option>
              {artists.map((artist, index) => (
                <option key={index} value={artist}>
                  {artist}
                </option>
              ))}
            </select>
          </div>

          <button className="clear-filters" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        {/* Order Controls */}
        <div className="order-controls">
          <label className="order-label">Order by:</label>
          <div className="order-options">
            <label className="radio-option">
              <input
                type="radio"
                name="orderBy"
                value="artist"
                checked={orderBy === "artist"}
                onChange={(e) => setOrderBy(e.target.value)}
              />
              <span>Artist</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="orderBy"
                value="song"
                checked={orderBy === "song"}
                onChange={(e) => setOrderBy(e.target.value)}
              />
              <span>Song Name</span>
            </label>
          </div>
        </div>

        {/* Songs Grid */}
        {filteredSongs.length > 0 ? (
          <div className="songs-grid">
            {filteredSongs.map((song) => (
              <div
                key={song.id}
                className="song-card clickable"
                onClick={() => handleSongClick(song)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleSongClick(song);
                  }
                }}
              >
                <div className="song-title">{song.title}</div>
                <div className="song-artist">by {song.artist}</div>
                <div className="song-meta">
                  <GenrePills genres={song.genre} className="song-genres" />
                  {song.duration && (
                    <span className="song-duration">⏱️ {song.duration}</span>
                  )}
                </div>
                <div className="click-hint">Click for details</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-songs">
            {songs.length === 0
              ? "No songs in this library yet."
              : "No songs found. Try adjusting your filters."}
          </div>
        )}

        {/* Song Modal */}
        <SongModal
          song={selectedSong}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </div>
    </div>
  );
};

export default PublicLibraryView;
