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
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    onSearch?.(e.target.value);
  };

  const totalPages = Math.ceil(songs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSongs = songs.slice(startIndex, endIndex);

  return (
    <div className="songs-table">
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
              <th className="songs-table__th songs-table__th--song">
                SONG DETAILS
              </th>
              <th className="songs-table__th songs-table__th--artist">
                ARTIST
              </th>
              <th className="songs-table__th songs-table__th--genre">GENRE</th>
              <th className="songs-table__th songs-table__th--duration">
                DURATION
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
                className="songs-table__row"
                onClick={() => onViewDetails?.(song)}
                style={{ cursor: "pointer" }}
              >
                <td className="songs-table__td songs-table__td--song">
                  <div className="songs-table__song-cell">
                    <div className="songs-table__cover"></div>
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
