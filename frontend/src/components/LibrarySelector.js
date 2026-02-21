import React, { useState, useEffect } from "react";
import axios from "axios";
import { Select, SelectItem, Button, Input } from "@heroui/react";

const LibrarySelector = ({
  selectedLibrary,
  onSelectLibrary,
  onCreateLibrary,
}) => {
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLibraryName, setNewLibraryName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLibraries();
  }, []);

  const fetchLibraries = async () => {
    try {
      const response = await axios.get("/api/libraries");
      setLibraries(response.data);
      if (response.data.length > 0 && !selectedLibrary) {
        // Auto-select first library if none is selected
        onSelectLibrary(response.data[0]);
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch libraries:", err);
      setLoading(false);
    }
  };

  const handleCreateLibrary = async (e) => {
    e.preventDefault();
    setError("");

    if (!newLibraryName.trim()) {
      setError("Library name is required");
      return;
    }

    try {
      const response = await axios.post("/api/libraries", {
        name: newLibraryName.trim(),
      });
      const newLibrary = response.data;
      setLibraries([...libraries, newLibrary]);
      setNewLibraryName("");
      setShowCreateForm(false);
      onSelectLibrary(newLibrary);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create library");
    }
  };

  if (loading) {
    return (
      <div className="py-4 text-center text-sm text-default-500">
        Loading libraries...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <Select
            label="Library"
            selectedKeys={
              selectedLibrary ? [selectedLibrary.id.toString()] : []
            }
            onSelectionChange={(keys) => {
              const selectedId = Array.from(keys)[0];
              if (!selectedId) return;
              const library = libraries.find(
                (lib) => lib.id === parseInt(selectedId.toString(), 10)
              );
              if (library) {
                onSelectLibrary(library);
              }
            }}
            className="max-w-xs md:max-w-sm"
          >
            {libraries.map((library) => (
              <SelectItem
                key={library.id.toString()}
                value={library.id.toString()}
              >
                {library.name}
              </SelectItem>
            ))}
          </Select>
        </div>

        <Button
          color="primary"
          variant="flat"
          onPress={() => setShowCreateForm(!showCreateForm)}
          className="w-full md:w-auto"
        >
          {showCreateForm ? "Cancel" : "New Library"}
        </Button>
      </div>

      {showCreateForm && (
        <div className="space-y-3 rounded-lg border border-default-200 bg-content1/60 p-4">
          {error && <p className="text-sm text-danger">{error}</p>}
          <form
            onSubmit={handleCreateLibrary}
            className="flex flex-col gap-3 md:flex-row"
          >
            <Input
              value={newLibraryName}
              onChange={(e) => setNewLibraryName(e.target.value)}
              placeholder="Enter library name"
              label="New library name"
              isRequired
              className="flex-1"
            />
            <Button type="submit" color="primary">
              Create
            </Button>
          </form>
        </div>
      )}

      {selectedLibrary && (
        <div className="text-sm text-default-600">
          <span className="mr-1 font-semibold">Share URL:</span>
          <code className="rounded bg-content2 px-2 py-1 font-mono text-xs">
            {window.location.origin}/library/{selectedLibrary.slug}
          </code>
        </div>
      )}
    </div>
  );
};

export default LibrarySelector;

