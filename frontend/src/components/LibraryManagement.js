import React, { useState, useEffect } from "react";
import axios from "axios";
import ShareActions from "./ShareActions";
import { Server } from "@heroui/shared-icons";

const LibraryManagement = ({ onLibraryUpdate }) => {
  const [libraries, setLibraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingLibrary, setEditingLibrary] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    fetchLibraries();
  }, []);

  const fetchLibraries = async () => {
    try {
      const response = await axios.get("/api/libraries");
      setLibraries(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch libraries");
      setLoading(false);
    }
  };

  const handleDeleteLibrary = async (library) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${library.name}"? This will permanently delete all songs in this library!`,
      )
    ) {
      return;
    }

    try {
      await axios.delete(`/api/libraries/${library.id}`);
      setLibraries(libraries.filter((lib) => lib.id !== library.id));
      setSuccess(`Library "${library.name}" deleted successfully`);
      setTimeout(() => setSuccess(""), 3000);
      if (onLibraryUpdate) {
        onLibraryUpdate();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete library");
    }
  };

  const handleEditLibrary = (library) => {
    setEditingLibrary(library);
    setEditName(library.name);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      setError("Library name is required");
      return;
    }

    try {
      await axios.put(`/api/libraries/${editingLibrary.id}`, {
        name: editName.trim(),
      });
      setLibraries(
        libraries.map((lib) =>
          lib.id === editingLibrary.id
            ? { ...lib, name: editName.trim() }
            : lib,
        ),
      );
      setEditingLibrary(null);
      setEditName("");
      setSuccess("Library updated successfully");
      setTimeout(() => setSuccess(""), 3000);
      if (onLibraryUpdate) {
        onLibraryUpdate();
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update library");
    }
  };

  const handleCancelEdit = () => {
    setEditingLibrary(null);
    setEditName("");
    setError("");
  };

  if (loading) {
    return (
      <div className="library-management">
        <div className="library-management__loading">
          <p>Loading libraries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="admin-login">
        <h2 className="flex items-center gap-2">
          <Server className="w-6 h-6" fill="currentColor" />
          Manage Libraries
        </h2>

        {error && (
          <div className="error-message" style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              backgroundColor: "#d4edda",
              color: "#155724",
              padding: "0.75rem",
              borderRadius: "4px",
              marginBottom: "1rem",
            }}
          >
            {success}
          </div>
        )}

        {libraries.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666" }}>
            No libraries found. Create one from the library selector.
          </p>
        ) : (
          <div style={{ marginTop: "1.5rem" }}>
            {libraries.map((library) => (
              <div key={library.id} className="library-card">
                {editingLibrary?.id === library.id ? (
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "0.5rem",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEdit}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: "0 0 0.5rem 0" }}>{library.name}</h3>
                      <ShareActions
                        url={`${window.location.origin}/library/${library.slug}`}
                        libraryName={library.name}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => handleEditLibrary(library)}
                        style={{
                          padding: "0.5rem 1rem",
                          backgroundColor: "#667eea",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLibrary(library)}
                        style={{
                          padding: "0.5rem 1rem",
                          backgroundColor: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default LibraryManagement;
