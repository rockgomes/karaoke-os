import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
  useDisclosure,
} from "@heroui/react";
import { StatCard, Toast } from "./design-system";
import SongsTable from "./SongsTable";
import SongDetailModal from "./SongDetailModal";
import BatchImport from "./BatchImport";
import LibrarySelector from "./LibrarySelector";
import "./AdminPanelNew.css";

const AdminPanelNew = ({ selectedLibrary, onLibrarySelect }) => {
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stats, setStats] = useState({
    totalSongs: 0,
    popularGenre: "N/A",
    pendingRequests: 0,
    qrScans: 143,
  });

  // Modals
  const {
    isOpen: isAddOpen,
    onOpen: onAddOpen,
    onClose: onAddClose,
  } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isImportOpen,
    onOpen: onImportOpen,
    onClose: onImportClose,
  } = useDisclosure();
  const {
    isOpen: isDetailOpen,
    onOpen: onDetailOpen,
    onClose: onDetailClose,
  } = useDisclosure();

  const [selectedSong, setSelectedSong] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    genre: "",
    duration: "",
    year: "",
    album: "",
  });
  const [editingSongId, setEditingSongId] = useState(null);

  useEffect(() => {
    if (selectedLibrary) {
      fetchSongs();
    } else {
      setLoading(false);
    }
  }, [selectedLibrary]);

  const fetchSongs = async () => {
    if (!selectedLibrary) return;
    try {
      const response = await axios.get(
        `/api/libraries/${selectedLibrary.id}/songs`,
      );
      setSongs(response.data);
      setFilteredSongs(response.data);
      calculateStats(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch songs");
      setLoading(false);
    }
  };

  const calculateStats = (songsList) => {
    const total = songsList.length;

    // Find most popular genre
    const genreCounts = {};
    songsList.forEach((song) => {
      if (song.genre) {
        genreCounts[song.genre] = (genreCounts[song.genre] || 0) + 1;
      }
    });
    const popularGenre =
      Object.keys(genreCounts).length > 0
        ? Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0][0]
        : "N/A";

    setStats({
      totalSongs: total,
      popularGenre,
      pendingRequests: 12,
      qrScans: 143,
    });
  };

  const handleAddSong = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.artist) {
      setError("Title and artist are required");
      return;
    }

    try {
      const response = await axios.post(
        `/api/libraries/${selectedLibrary.id}/songs`,
        formData,
      );
      setSongs([...songs, response.data]);
      setFilteredSongs([...songs, response.data]);
      calculateStats([...songs, response.data]);
      setFormData({
        title: "",
        artist: "",
        genre: "",
        duration: "",
        year: "",
        album: "",
      });
      onAddClose();
      setSuccess("Song added successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add song");
    }
  };

  const handleEditSong = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.artist) {
      setError("Title and artist are required");
      return;
    }

    try {
      await axios.put(
        `/api/libraries/${selectedLibrary.id}/songs/${editingSongId}`,
        formData,
      );
      const updatedSongs = songs.map((song) =>
        song.id === editingSongId ? { ...song, ...formData } : song,
      );
      setSongs(updatedSongs);
      setFilteredSongs(updatedSongs);
      calculateStats(updatedSongs);
      setEditingSongId(null);
      setFormData({
        title: "",
        artist: "",
        genre: "",
        duration: "",
        year: "",
        album: "",
      });
      onEditClose();
      setSuccess("Song updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update song");
    }
  };

  const handleDeleteSong = async (songId) => {
    try {
      await axios.delete(
        `/api/libraries/${selectedLibrary.id}/songs/${songId}`,
      );
      const updatedSongs = songs.filter((song) => song.id !== songId);
      setSongs(updatedSongs);
      setFilteredSongs(updatedSongs);
      calculateStats(updatedSongs);
      setSuccess("Song deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete song");
    }
  };

  const openEditModal = (song) => {
    setEditingSongId(song.id);
    setFormData({
      title: song.title,
      artist: song.artist,
      genre: song.genre || "",
      duration: song.duration || "",
      year: song.year || "",
      album: song.album || "",
    });
    onEditOpen();
  };

  const handleSearch = (term) => {
    if (!term) {
      setFilteredSongs(songs);
      return;
    }
    const filtered = songs.filter(
      (song) =>
        song.title?.toLowerCase().includes(term.toLowerCase()) ||
        song.artist?.toLowerCase().includes(term.toLowerCase()),
    );
    setFilteredSongs(filtered);
  };

  if (!selectedLibrary) {
    return (
      <div className="admin-panel-new">
        <div className="admin-panel-new__empty">
          <LibrarySelector
            selectedLibrary={selectedLibrary}
            onSelectLibrary={onLibrarySelect}
            onCreateLibrary={onLibrarySelect}
          />
          <p className="admin-panel-new__empty-text">
            Please select or create a library to manage songs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-new">
      {/* Page Header */}
      <div className="admin-panel-new__header">
        <div className="admin-panel-new__header-left">
          <h1 className="admin-panel-new__title">Songs Library</h1>
          <p className="admin-panel-new__subtitle">
            Manage your music database. Enable AI to auto-tag genres and
            duration.
          </p>
        </div>
        <div className="admin-panel-new__header-right">
          <Button variant="flat" onPress={onImportOpen}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import CSV
          </Button>
          <Button color="primary" onPress={onAddOpen}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New Song
          </Button>
        </div>
      </div>

      {/* AI Banner */}
      <div className="admin-panel-new__ai-banner">
        <div className="admin-panel-new__ai-banner-content">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span>AI-powered metadata enrichment available in batch import</span>
        </div>
        <Button size="sm" variant="light">
          Learn More
        </Button>
      </div>

      {/* Stats Row */}
      <div className="admin-panel-new__stats">
        <StatCard
          value={stats.totalSongs.toLocaleString()}
          label="Total Songs"
          subtitle="+12 this week"
        />
        <StatCard
          value={stats.popularGenre}
          label="Most Popular Genre"
          subtitle="Trending"
          valueSize="small"
        />
        <StatCard
          value={stats.pendingRequests.toString()}
          label="Pending Requests"
          subtitle="5 urgent"
          variant="warning"
        />
        <StatCard
          value={stats.qrScans.toString()}
          label="QR Scans Today"
          subtitle="+16% vs yesterday"
        />
      </div>

      {/* Library Selector */}
      <div className="admin-panel-new__library">
        <LibrarySelector
          selectedLibrary={selectedLibrary}
          onSelectLibrary={onLibrarySelect}
          onCreateLibrary={onLibrarySelect}
        />
      </div>

      {/* Songs Table */}
      {loading ? (
        <div className="admin-panel-new__loading">Loading songs...</div>
      ) : (
        <SongsTable
          songs={filteredSongs}
          onEdit={openEditModal}
          onDelete={handleDeleteSong}
          onSearch={handleSearch}
          onViewDetails={handleViewDetails}
        />
      )}

      {/* Song Detail Modal */}
      <SongDetailModal
        song={selectedSong}
        isOpen={isDetailOpen}
        onClose={onDetailClose}
        onEdit={openEditModal}
        onDelete={handleDeleteSong}
      />

      {/* Toast Messages */}
      {error && (
        <Toast type="error" message={error} onClose={() => setError("")} />
      )}
      {success && (
        <Toast
          type="success"
          message={success}
          onClose={() => setSuccess("")}
        />
      )}

      {/* Add Song Modal */}
      <Modal isOpen={isAddOpen} onClose={onAddClose} size="2xl">
        <ModalContent>
          <form onSubmit={handleAddSong}>
            <ModalHeader>Add New Song</ModalHeader>
            <ModalBody>
              <div className="admin-panel-new__form-grid">
                <Input
                  label="Song Title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  isRequired
                />
                <Input
                  label="Artist"
                  value={formData.artist}
                  onChange={(e) =>
                    setFormData({ ...formData, artist: e.target.value })
                  }
                  isRequired
                />
                <Input
                  label="Genre"
                  value={formData.genre}
                  onChange={(e) =>
                    setFormData({ ...formData, genre: e.target.value })
                  }
                />
                <Input
                  label="Duration"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  placeholder="e.g., 3:30"
                />
                <Input
                  type="number"
                  label="Year"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                  placeholder="e.g., 1985"
                />
                <Input
                  label="Album"
                  value={formData.album}
                  onChange={(e) =>
                    setFormData({ ...formData, album: e.target.value })
                  }
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onAddClose}>
                Cancel
              </Button>
              <Button color="primary" type="submit">
                Add Song
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Edit Song Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="2xl">
        <ModalContent>
          <form onSubmit={handleEditSong}>
            <ModalHeader>Edit Song</ModalHeader>
            <ModalBody>
              <div className="admin-panel-new__form-grid">
                <Input
                  label="Song Title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  isRequired
                />
                <Input
                  label="Artist"
                  value={formData.artist}
                  onChange={(e) =>
                    setFormData({ ...formData, artist: e.target.value })
                  }
                  isRequired
                />
                <Input
                  label="Genre"
                  value={formData.genre}
                  onChange={(e) =>
                    setFormData({ ...formData, genre: e.target.value })
                  }
                />
                <Input
                  label="Duration"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  placeholder="e.g., 3:30"
                />
                <Input
                  type="number"
                  label="Year"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                  placeholder="e.g., 1985"
                />
                <Input
                  label="Album"
                  value={formData.album}
                  onChange={(e) =>
                    setFormData({ ...formData, album: e.target.value })
                  }
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onEditClose}>
                Cancel
              </Button>
              <Button color="primary" type="submit">
                Save Changes
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Batch Import Modal */}
      <Modal isOpen={isImportOpen} onClose={onImportClose} size="3xl">
        <ModalContent>
          <ModalHeader>Batch Import Songs</ModalHeader>
          <ModalBody>
            <BatchImport
              selectedLibrary={selectedLibrary}
              onImportComplete={() => {
                fetchSongs();
                onImportClose();
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default AdminPanelNew;
