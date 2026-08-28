import React, { useState } from "react";
import { SearchBar, FilterPill, Badge } from "./design-system";
import "./SongsTable.css";

const SongsTable = ({
  songs,
  onEdit,
  onDelete,
  onSearch,
  onFilterGenre,
  onFilterStatus,
  onViewDetails,
  onBulkDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const itemsPerPage = 10;

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedSongs = [...songs].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aVal = a[sortConfig.key] || "";
    const bVal = b[sortConfig.key] || "";

    if (sortConfig.direction === "asc") {
      return aVal.toString().localeCompare(bVal.toString());
    } else {
      return bVal.toString().localeCompare(aVal.toString());
    }
  });

  const totalPages = Math.ceil(sortedSongs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSongs = sortedSongs.slice(startIndex, endIndex);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedSongs(currentSongs.map((s) => s.id));
    } else {
      setSelectedSongs([]);
    }
  };

  const handleSelectSong = (songId, e) => {
    e.stopPropagation();
    if (selectedSongs.includes(songId)) {
      setSelectedSongs(selectedSongs.filter((id) => id !== songId));
    } else {
      setSelectedSongs([...selectedSongs, songId]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedSongs.length === 0) return;
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedSongs.length} song(s)?`,
      )
    ) {
      onBulkDelete?.(selectedSongs);
      setSelectedSongs([]);
    }
  };

  const allSelected =
    currentSongs.length > 0 &&
    currentSongs.every((s) => selectedSongs.includes(s.id));

  return (
    <div className="songs-table">
      {/* Bulk Action Bar */}
      {selectedSongs.length > 0 && (
        <div className="songs-table__bulk-bar">
          <span className="songs-table__bulk-count">
            {selectedSongs.length} song{selectedSongs.length > 1 ? "s" : ""}{" "}
            selected
          </span>
          <div className="songs-table__bulk-actions">
            <button
              className="songs-table__bulk-btn songs-table__bulk-btn--danger"
              onClick={handleBulkDelete}
            >
              Delete Selected
            </button>
            <button
              className="songs-table__bulk-btn"
              onClick={() => setSelectedSongs([])}
            >
              Cancel Selection
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="songs-table__toolbar">
        <div className="songs-table__toolbar-left">
          <SearchBar
            placeholder="Search songs, artists..."
            value={searchTerm}
            onChange={handleSearch}
            onClear={() => {
              setSearchTerm("");
              onSearch?.("");
            }}
          />
          <FilterPill label="Genre" onClick={onFilterGenre} />
          <FilterPill label="Status" onClick={onFilterStatus} />
        </div>
        <div className="songs-table__toolbar-right">
          Showing {startIndex + 1}–{Math.min(endIndex, songs.length)} of{" "}
          {songs.length}
        </div>
      </div>

      {/* Table */}
      <div className="songs-table__container">
        <table className="songs-table__table">
          <thead>
            <tr>
              <th className="songs-table__th songs-table__th--checkbox">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="songs-table__checkbox"
                />
              </th>
              <th
                className="songs-table__th songs-table__th--song songs-table__th--sortable"
                onClick={() => handleSort("title")}
              >
                SONG DETAILS
                {sortConfig.key === "title" && (
                  <span className="songs-table__sort-icon">
                    {sortConfig.direction === "asc" ? " ↑" : " ↓"}
                  </span>
                )}
              </th>
              <th
                className="songs-table__th songs-table__th--artist songs-table__th--sortable"
                onClick={() => handleSort("artist")}
              >
                ARTIST
                {sortConfig.key === "artist" && (
                  <span className="songs-table__sort-icon">
                    {sortConfig.direction === "asc" ? " ↑" : " ↓"}
                  </span>
                )}
              </th>
              <th
                className="songs-table__th songs-table__th--genre songs-table__th--sortable"
                onClick={() => handleSort("genre")}
              >
                GENRE
                {sortConfig.key === "genre" && (
                  <span className="songs-table__sort-icon">
                    {sortConfig.direction === "asc" ? " ↑" : " ↓"}
                  </span>
                )}
              </th>
              <th
                className="songs-table__th songs-table__th--duration songs-table__th--sortable"
                onClick={() => handleSort("duration")}
              >
                DURATION
                {sortConfig.key === "duration" && (
                  <span className="songs-table__sort-icon">
                    {sortConfig.direction === "asc" ? " ↑" : " ↓"}
                  </span>
                )}
              </th>
              <th className="songs-table__th songs-table__th--tags">AI TAGS</th>
              <th className="songs-table__th songs-table__th--actions">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {currentSongs.map((song) => (
              <tr
                key={song.id}
                className={`songs-table__row ${selectedSongs.includes(song.id) ? "songs-table__row--selected" : ""}`}
                onClick={() => onViewDetails?.(song)}
                style={{ cursor: "pointer" }}
              >
                <td className="songs-table__td songs-table__td--checkbox">
                  <input
                    type="checkbox"
                    checked={selectedSongs.includes(song.id)}
                    onChange={(e) => handleSelectSong(song.id, e)}
                    className="songs-table__checkbox"
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="songs-table__td songs-table__td--song">
                  <div className="songs-table__song-cell">
                    <div className="songs-table__cover">
                      {song.cover_url && (
                        <img
                          src={song.cover_url}
                          alt=""
                          className="songs-table__cover-img"
                          loading="lazy"
                          // Cover Art Archive has no artwork for every
                          // release. Hiding the image leaves the empty
                          // slot behind it, which is the intended look.
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </div>
                    <div className="songs-table__song-info">
                      <div className="songs-table__song-title">
                        {song.title}
                      </div>
                      <div className="songs-table__song-subtitle">
                        {song.artist} {song.year ? `• ${song.year}` : ""}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="songs-table__td songs-table__td--artist">
                  {song.artist}
                </td>
                <td className="songs-table__td songs-table__td--genre">
                  {song.genre || "—"}
                </td>
                <td className="songs-table__td songs-table__td--duration">
                  <span className="songs-table__duration">
                    {song.duration || "—"}
                  </span>
                </td>
                <td className="songs-table__td songs-table__td--tags">
                  <div className="songs-table__tags">
                    {song.album && <Badge variant="ai" label="Album" />}
                    {song.genre && <Badge variant="ai" label="Genre" />}
                  </div>
                </td>
                <td className="songs-table__td songs-table__td--actions">
                  <button
                    className="songs-table__action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails?.(song);
                    }}
                    title="View details"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="songs-table__footer">
        <div className="songs-table__footer-left">
          Showing {startIndex + 1}–{Math.min(endIndex, songs.length)} of{" "}
          {songs.length} songs
        </div>
        <div className="songs-table__footer-right">
          <button
            className="songs-table__page-btn"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          {[...Array(Math.min(3, totalPages))].map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                className={`songs-table__page-btn ${currentPage === pageNum ? "songs-table__page-btn--active" : ""}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            className="songs-table__page-btn"
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SongsTable;
