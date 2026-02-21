import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Button,
  RadioGroup,
  Radio,
  Spinner,
  Alert,
  Chip,
} from "@heroui/react";
import { SearchIcon, HeadphonesIcon } from "@heroui/shared-icons";
import SongModal from "./SongModal";
import GenrePills from "./GenrePills";
import LibrarySelector from "./LibrarySelector";

const SongList = ({ selectedLibrary, onLibrarySelect }) => {
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

  // Order state
  const [orderBy, setOrderBy] = useState("artist"); // "artist" or "song"

  // Modal states
  const [selectedSong, setSelectedSong] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (selectedLibrary) {
      fetchSongs();
      fetchGenres();
      fetchArtists();
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

  const fetchGenres = async () => {
    if (!selectedLibrary) return;
    try {
      const response = await axios.get(
        `/api/libraries/${selectedLibrary.id}/genres`
      );
      setGenres(response.data);
    } catch (err) {
      console.error("Failed to fetch genres:", err);
    }
  };

  const fetchArtists = async () => {
    if (!selectedLibrary) return;
    try {
      const response = await axios.get(
        `/api/libraries/${selectedLibrary.id}/artists`
      );
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

    // Apply ordering - create a new array to ensure React detects the change
    filtered = [...filtered].sort((a, b) => {
      if (orderBy === "artist") {
        // First sort by artist, then by title
        if (a.artist.toLowerCase() === b.artist.toLowerCase()) {
          return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        }
        return a.artist.toLowerCase().localeCompare(b.artist.toLowerCase());
      } else {
        // Sort by song title
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
      <div className="container flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-lg">Loading songs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <Alert color="danger" className="mt-4">
          {error}
        </Alert>
      </div>
    );
  }

  if (!selectedLibrary) {
    return (
      <div className="container max-w-7xl mx-auto p-4">
        <Card className="p-6">
          <LibrarySelector
            selectedLibrary={selectedLibrary}
            onSelectLibrary={onLibrarySelect}
            onCreateLibrary={onLibrarySelect}
          />
          <p className="text-center mt-8 text-default-500">
            Please select or create a library to view songs.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-4">
      <Card className="p-6">
        <LibrarySelector
          selectedLibrary={selectedLibrary}
          onSelectLibrary={onLibrarySelect}
          onCreateLibrary={onLibrarySelect}
        />
        <h2 className="text-2xl font-bold text-black dark:text-white text-center my-6 flex items-center justify-center gap-2">
          <HeadphonesIcon className="w-6 h-6" />
          <span>Available Songs ({filteredSongs.length})</span>
        </h2>

        {/* Filters */}
        <Card className="mb-6 bg-content1/60 p-4 border border-default-100">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <Input
              type="text"
              label="Search by title or artist"
              placeholder="Type to search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              startContent={<SearchIcon className="text-default-400" />}
            />

            <Select
              label="Filter by Genre"
              placeholder="All Genres"
              selectedKeys={selectedGenre ? [selectedGenre] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0]?.toString() || "";
                setSelectedGenre(selected);
              }}
              className="flex-1"
            >
              <SelectItem key="" value="">
                All Genres
              </SelectItem>
              {genres.map((genre, index) => (
                <SelectItem key={genre} value={genre}>
                  {genre}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="Filter by Artist"
              placeholder="All Artists"
              selectedKeys={selectedArtist ? [selectedArtist] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0]?.toString() || "";
                setSelectedArtist(selected);
              }}
              className="flex-1"
            >
              <SelectItem key="" value="">
                All Artists
              </SelectItem>
              {artists.map((artist, index) => (
                <SelectItem key={artist} value={artist}>
                  {artist}
                </SelectItem>
              ))}
            </Select>

            <Button
              color="default"
              variant="flat"
              onClick={clearFilters}
              className="w-full lg:w-auto lg:self-end"
            >
              Clear Filters
            </Button>
          </div>
        </Card>

        {/* Order Controls */}
        <Card className="mb-6 bg-content1/60 p-4 border border-default-100">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <span className="font-semibold">Order by:</span>
            <RadioGroup
              value={orderBy}
              onValueChange={setOrderBy}
              orientation="horizontal"
              size="sm"
            >
              <Radio value="artist">Artist</Radio>
              <Radio value="song">Song Name</Radio>
            </RadioGroup>
          </div>
        </Card>

        {/* Songs Grid */}
        {filteredSongs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredSongs.map((song) => (
              <Card
                key={song.id}
                isPressable
                isHoverable
                onPress={() => handleSongClick(song)}
                className="cursor-pointer border border-default-100 hover:border-primary hover:shadow-md transition-all"
              >
                <CardBody className="p-4">
                  <div className="mb-1 text-lg font-bold">{song.title}</div>
                  <div className="mb-3 text-sm text-default-600">
                    by {song.artist}
                  </div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <GenrePills genres={song.genre} />
                    {song.duration && (
                      <Chip size="sm" variant="flat" color="default">
                        ⏱️ {song.duration}
                      </Chip>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-default-400">
                    Click for details
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-default-500">
            {songs.length === 0
              ? "No songs available yet. Admin can add songs from the admin panel."
              : "No songs match your current filters."}
          </div>
        )}

        {/* Song Modal */}
        <SongModal
          song={selectedSong}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </Card>
    </div>
  );
};

export default SongList;
