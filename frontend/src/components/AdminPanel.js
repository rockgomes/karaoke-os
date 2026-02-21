import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardBody,
  CardHeader,
  Tabs,
  Tab,
  Input,
  Button,
  Alert,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { Activity, Plus, AddNoteBulk } from "@heroui/shared-icons";
import BatchImport from "./BatchImport";
import LibrarySelector from "./LibrarySelector";
import GenrePills from "./GenrePills";

const AdminPanel = ({ selectedLibrary, onLibrarySelect }) => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingSong, setEditingSong] = useState(null);
  const [activeTab, setActiveTab] = useState("single"); // "single" or "batch"

  // Form state for adding new songs
  const [newSong, setNewSong] = useState({
    title: "",
    artist: "",
    genre: "",
    duration: "",
    year: "",
    album: "",
  });

  // Form state for editing songs
  const [editForm, setEditForm] = useState({
    title: "",
    artist: "",
    genre: "",
    duration: "",
    year: "",
    album: "",
  });

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
        `/api/libraries/${selectedLibrary.id}/songs`
      );
      setSongs(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch songs");
      setLoading(false);
    }
  };

  const handleAddSong = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newSong.title || !newSong.artist) {
      setError("Title and artist are required");
      return;
    }

    if (!selectedLibrary) {
      setError("Please select a library");
      return;
    }

    try {
      const response = await axios.post(
        `/api/libraries/${selectedLibrary.id}/songs`,
        newSong
      );
      setSongs([...songs, response.data]);
      setNewSong({
        title: "",
        artist: "",
        genre: "",
        duration: "",
        year: "",
        album: "",
      });
      setSuccess("Song added successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add song");
    }
  };

  const handleEditSong = (song) => {
    setEditingSong(song.id);
    setEditForm({
      title: song.title,
      artist: song.artist,
      genre: song.genre || "",
      duration: song.duration || "",
      year: song.year || "",
      album: song.album || "",
    });
  };

  const handleUpdateSong = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!editForm.title || !editForm.artist) {
      setError("Title and artist are required");
      return;
    }

    if (!selectedLibrary) {
      setError("Please select a library");
      return;
    }

    try {
      await axios.put(
        `/api/libraries/${selectedLibrary.id}/songs/${editingSong}`,
        editForm
      );
      setSongs(
        songs.map((song) =>
          song.id === editingSong ? { ...song, ...editForm } : song
        )
      );
      setEditingSong(null);
      setEditForm({ title: "", artist: "", genre: "" });
      setSuccess("Song updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update song");
    }
  };

  const handleDeleteSong = async (songId) => {
    if (!window.confirm("Are you sure you want to delete this song?")) {
      return;
    }

    setError("");
    setSuccess("");

    if (!selectedLibrary) {
      setError("Please select a library");
      return;
    }

    try {
      await axios.delete(
        `/api/libraries/${selectedLibrary.id}/songs/${songId}`
      );
      setSongs(songs.filter((song) => song.id !== songId));
      setSuccess("Song deleted successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete song");
    }
  };

  const cancelEdit = () => {
    setEditingSong(null);
    setEditForm({
      title: "",
      artist: "",
      genre: "",
      duration: "",
      year: "",
      album: "",
    });
  };

  const handleBatchImportComplete = () => {
    // Refresh the songs list after batch import
    fetchSongs();
    setSuccess("Batch import completed! Songs list refreshed.");
    setTimeout(() => setSuccess(""), 3000);
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!selectedLibrary) {
    return (
      <div className="container max-w-7xl mx-auto p-4">
        <Card className="p-6">
          <CardHeader>
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Activity className="w-6 h-6" fill="currentColor" />
                Manage Your Songs
              </h2>
              <p className="text-default-500">
                Manage your karaoke song collection
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <LibrarySelector
              selectedLibrary={selectedLibrary}
              onSelectLibrary={onLibrarySelect}
              onCreateLibrary={onLibrarySelect}
            />
            <p className="text-center mt-8 text-default-500">
              Please select or create a library to manage songs.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-4">
      <Card className="p-6">
        <CardHeader>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6" fill="currentColor" />
              Manage Your Songs
            </h2>
            <p className="text-default-500">
              Manage your karaoke song collection
            </p>
          </div>
        </CardHeader>

        <CardBody>
          <LibrarySelector
            selectedLibrary={selectedLibrary}
            onSelectLibrary={onLibrarySelect}
            onCreateLibrary={onLibrarySelect}
          />

          {error && (
            <Alert color="danger" className="my-4">
              {error}
            </Alert>
          )}
          {success && (
            <Alert color="success" className="my-4">
              {success}
            </Alert>
          )}

          {/* Tab Navigation */}
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key.toString())}
            className="mt-6"
          >
            <Tab
              key="single"
              title={
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" fill="currentColor" />
                  Add Single Song
                </span>
              }
            >
              <Card className="mt-4">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-primary">
                    Add New Song
                  </h3>
                </CardHeader>
                <CardBody>
                  <form
                    onSubmit={handleAddSong}
                    className="flex flex-col gap-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="Song Title"
                        value={newSong.title}
                        onChange={(e) =>
                          setNewSong({ ...newSong, title: e.target.value })
                        }
                        placeholder="Enter song title"
                        isRequired
                      />

                      <Input
                        label="Artist"
                        value={newSong.artist}
                        onChange={(e) =>
                          setNewSong({ ...newSong, artist: e.target.value })
                        }
                        placeholder="Enter artist name"
                        isRequired
                      />

                      <Input
                        label="Genre"
                        description="(optional)"
                        value={newSong.genre}
                        onChange={(e) =>
                          setNewSong({ ...newSong, genre: e.target.value })
                        }
                        placeholder="Enter genre"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="Duration"
                        value={newSong.duration}
                        onChange={(e) =>
                          setNewSong({ ...newSong, duration: e.target.value })
                        }
                        placeholder="e.g., 3:30"
                      />

                      <Input
                        type="number"
                        label="Year"
                        value={newSong.year}
                        onChange={(e) =>
                          setNewSong({ ...newSong, year: e.target.value })
                        }
                        placeholder="e.g., 1985"
                        min={1900}
                        max={2024}
                      />

                      <Input
                        label="Album"
                        value={newSong.album}
                        onChange={(e) =>
                          setNewSong({ ...newSong, album: e.target.value })
                        }
                        placeholder="Enter album name"
                      />
                    </div>

                    <Button type="submit" color="primary">
                      Add Song
                    </Button>
                  </form>
                </CardBody>
              </Card>
            </Tab>
            <Tab
              key="batch"
              title={
                <span className="flex items-center gap-2">
                  <AddNoteBulk className="w-4 h-4" fill="currentColor" />
                  Batch Import
                </span>
              }
            >
              <BatchImport
                onImportComplete={handleBatchImportComplete}
                selectedLibrary={selectedLibrary}
              />
            </Tab>
          </Tabs>

          {/* Songs List */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-primary mb-4">
              Current Songs ({songs.length})
            </h3>

            {songs.length > 0 ? (
              <div className="flex flex-col gap-4">
                {songs.map((song) => (
                  <Card key={song.id}>
                    {editingSong === song.id ? (
                      <CardBody>
                        <form
                          onSubmit={handleUpdateSong}
                          className="flex flex-col gap-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                              label="Title"
                              value={editForm.title}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  title: e.target.value,
                                })
                              }
                              isRequired
                            />
                            <Input
                              label="Artist"
                              value={editForm.artist}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  artist: e.target.value,
                                })
                              }
                              isRequired
                            />
                            <Input
                              label="Genre"
                              description="(optional)"
                              value={editForm.genre || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  genre: e.target.value,
                                })
                              }
                              placeholder="Enter genre"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                              label="Duration"
                              value={editForm.duration}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  duration: e.target.value,
                                })
                              }
                              placeholder="e.g., 3:30"
                            />
                            <Input
                              type="number"
                              label="Year"
                              value={editForm.year}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  year: e.target.value,
                                })
                              }
                              placeholder="e.g., 1985"
                              min={1900}
                              max={2024}
                            />
                            <Input
                              label="Album"
                              value={editForm.album}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  album: e.target.value,
                                })
                              }
                              placeholder="Enter album name"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" color="primary">
                              Save
                            </Button>
                            <Button
                              type="button"
                              color="default"
                              variant="flat"
                              onPress={cancelEdit}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </CardBody>
                    ) : (
                      <CardBody>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">
                              {song.title}
                            </h4>
                            <p className="text-default-600">
                              by {song.artist}
                              {song.genre && ` • `}
                              {song.genre && <GenrePills genres={song.genre} />}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              color="primary"
                              variant="flat"
                              onPress={() => handleEditSong(song)}
                            >
                              Edit
                            </Button>
                            <Button
                              color="danger"
                              variant="flat"
                              onPress={() => handleDeleteSong(song.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardBody>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-default-500">
                No songs available. Add your first song using the form above!
              </p>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default AdminPanel;
