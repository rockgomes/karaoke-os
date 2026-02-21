import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { HeroUIProvider, Spinner } from "@heroui/react";
import axios from "axios";
import "./App.css";

// Contexts
import { ThemeProvider } from "./contexts/ThemeContext";

// Components
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Signup from "./components/Signup";
import AdminPanel from "./components/AdminPanel";
import LibraryManagement from "./components/LibraryManagement";
import PublicLibraryView from "./components/PublicLibraryView";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLibrary, setSelectedLibrary] = useState(null);

  // Add axios interceptor to handle 401 errors globally
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token is invalid or expired
          setToken(null);
          setUser(null);
          localStorage.removeItem("token");
          delete axios.defaults.headers.common["Authorization"];
          // Redirect will happen automatically due to state change
        }
        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        try {
          axios.defaults.headers.common["Authorization"] =
            `Bearer ${savedToken}`;
          const response = await axios.get("/api/auth/me");
          setUser(response.data);
          setToken(savedToken);

          // Fetch and set default library
          const librariesResponse = await axios.get("/api/libraries");
          if (librariesResponse.data.length > 0) {
            const savedLibraryId = localStorage.getItem("selectedLibraryId");
            const libraryToSelect = savedLibraryId
              ? librariesResponse.data.find(
                  (lib) => lib.id === parseInt(savedLibraryId),
                ) || librariesResponse.data[0]
              : librariesResponse.data[0];
            setSelectedLibrary(libraryToSelect);
          }
        } catch (err) {
          // Token is invalid, clear it
          localStorage.removeItem("token");
          delete axios.defaults.headers.common["Authorization"];
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const handleLibrarySelect = (library) => {
    setSelectedLibrary(library);
    localStorage.setItem("selectedLibraryId", library.id.toString());
  };

  const handleLogin = (newToken, userData) => {
    setUser(userData);
    localStorage.setItem("token", newToken);
    axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <HeroUIProvider>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <p className="text-lg">Loading...</p>
          </div>
        </div>
      </HeroUIProvider>
    );
  }

  return (
    <HeroUIProvider>
      <ThemeProvider>
        <Router>
          <div className="App min-h-screen bg-background text-foreground">
            <Navbar user={user} onLogout={handleLogout} />

            <Routes>
              {/* Public Routes - No Authentication Required */}
              <Route path="/" element={<PublicLibraryView />} />
              <Route path="/library/:slug" element={<PublicLibraryView />} />

              {/* Admin Routes - Authentication Required */}
              <Route
                path="/admin/login"
                element={
                  user ? (
                    <Navigate to="/admin/songs" />
                  ) : (
                    <Login onLogin={handleLogin} />
                  )
                }
              />
              <Route
                path="/admin/signup"
                element={
                  user ? (
                    <Navigate to="/admin/songs" />
                  ) : (
                    <Signup onSignup={handleLogin} />
                  )
                }
              />
              <Route
                path="/admin/songs"
                element={
                  user ? (
                    <AdminPanel
                      selectedLibrary={selectedLibrary}
                      onLibrarySelect={handleLibrarySelect}
                    />
                  ) : (
                    <Navigate to="/admin/login" />
                  )
                }
              />
              <Route
                path="/admin/libraries"
                element={
                  user ? (
                    <LibraryManagement
                      onLibraryUpdate={() => {
                        // Refresh libraries after update
                        axios.get("/api/libraries").then((response) => {
                          if (response.data.length > 0) {
                            const currentLib = response.data.find(
                              (lib) => lib.id === selectedLibrary?.id,
                            );
                            if (currentLib) {
                              setSelectedLibrary(currentLib);
                            } else {
                              setSelectedLibrary(response.data[0]);
                            }
                          }
                        });
                      }}
                    />
                  ) : (
                    <Navigate to="/admin/login" />
                  )
                }
              />

              {/* Redirect old routes */}
              <Route
                path="/login"
                element={<Navigate to="/admin/login" replace />}
              />
              <Route
                path="/signup"
                element={<Navigate to="/admin/signup" replace />}
              />
              <Route
                path="/admin"
                element={<Navigate to="/admin/songs" replace />}
              />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </HeroUIProvider>
  );
}

export default App;
