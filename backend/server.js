const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
const LASTFM_API_KEY = process.env.LASTFM_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database("./karaoke.db", (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Connected to SQLite database");
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create libraries table
  db.run(`
    CREATE TABLE IF NOT EXISTS libraries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create songs table with library_id foreign key (genre is now optional)
  db.run(`
    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      library_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      genre TEXT,
      duration TEXT,
      year INTEGER,
      album TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE
    )
  `);

  // Album art, added after the table already existed in the wild. SQLite has
  // no "ADD COLUMN IF NOT EXISTS", so the duplicate-column error is the
  // expected result on every run after the first and is ignored.
  for (const column of [
    "musicbrainz_id TEXT",
    "cover_url TEXT",
  ]) {
    db.run(`ALTER TABLE songs ADD COLUMN ${column}`, (err) => {
      if (err && !/duplicate column name/i.test(err.message)) {
        console.error(`Could not add songs.${column}:`, err.message);
      }
    });
  }

  // Create admin table (keeping for backward compatibility, but we'll use users table)
  db.run(
    `
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `,
    (err) => {
      if (!err) {
        // Create default admin if it doesn't exist
        createDefaultAdmin();
      }
    }
  );
}

// Create default admin user
async function createDefaultAdmin() {
  const defaultUsername = "admin";
  const defaultPassword = "admin123"; // Change this in production!

  db.get(
    "SELECT * FROM admins WHERE username = ?",
    [defaultUsername],
    async (err, row) => {
      if (!row) {
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        db.run(
          "INSERT INTO admins (username, password) VALUES (?, ?)",
          [defaultUsername, hashedPassword],
          (err) => {
            if (!err) {
              console.log(
                "Default admin created - Username: admin, Password: admin123"
              );
            }
          }
        );
      }
    }
  );
}

// Helper function to generate unique slug for library
function generateSlug(name) {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return baseSlug;
}

// Helper function to generate unique slug with random suffix
function generateUniqueSlug(baseSlug, callback) {
  let slug = baseSlug;
  let attempts = 0;
  const maxAttempts = 10;

  function checkAndGenerate() {
    db.get("SELECT id FROM libraries WHERE slug = ?", [slug], (err, row) => {
      if (err) {
        return callback(err, null);
      }
      if (!row) {
        return callback(null, slug);
      }
      // Slug exists, add random suffix
      attempts++;
      if (attempts >= maxAttempts) {
        return callback(new Error("Failed to generate unique slug"), null);
      }
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      slug = `${baseSlug}-${randomSuffix}`;
      checkAndGenerate();
    });
  }

  checkAndGenerate();
}

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// Routes

// User registration
app.post("/api/auth/register", async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res
      .status(400)
      .json({ error: "Email, username, and password are required" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Validate password strength
  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters long" });
  }

  // Check if user already exists
  db.get(
    "SELECT * FROM users WHERE email = ? OR username = ?",
    [email, username],
    async (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      if (row) {
        return res
          .status(400)
          .json({ error: "Email or username already exists" });
      }

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 10);
      db.run(
        "INSERT INTO users (email, username, password) VALUES (?, ?, ?)",
        [email, username, hashedPassword],
        function (err) {
          if (err) {
            return res.status(500).json({ error: "Failed to create user" });
          }

          const userId = this.lastID;

          // Create default library for the user
          const defaultLibraryName = "My Library";
          const defaultSlug = generateSlug(defaultLibraryName);

          generateUniqueSlug(defaultSlug, (slugErr, slug) => {
            if (slugErr) {
              console.error("Failed to create default library:", slugErr);
              // Continue anyway, user can create library manually
              const token = jwt.sign(
                { id: userId, email, username },
                JWT_SECRET
              );
              return res.status(201).json({
                token,
                user: { id: userId, email, username },
                message: "Account created successfully",
              });
            }

            db.run(
              "INSERT INTO libraries (user_id, name, slug) VALUES (?, ?, ?)",
              [userId, defaultLibraryName, slug],
              function (libErr) {
                // Generate token regardless of library creation success
                const token = jwt.sign(
                  { id: userId, email, username },
                  JWT_SECRET
                );
                res.status(201).json({
                  token,
                  user: { id: userId, email, username },
                  message: "Account created successfully",
                });
              }
            );
          });
        }
      );
    }
  );
});

// User login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  // Try to find user by email or username
  db.get(
    "SELECT * FROM users WHERE email = ? OR username = ?",
    [email, email],
    async (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }

      if (!row) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, row.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: row.id, email: row.email, username: row.username },
        JWT_SECRET
      );
      res.json({
        token,
        user: { id: row.id, email: row.email, username: row.username },
      });
    }
  );
});

// Get current user (protected)
app.get("/api/auth/me", authenticateToken, (req, res) => {
  db.get(
    "SELECT id, email, username, created_at FROM users WHERE id = ?",
    [req.user.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!row) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(row);
    }
  );
});

// ==================== LIBRARY ENDPOINTS ====================

// Create a new library
app.post("/api/libraries", authenticateToken, (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Library name is required" });
  }

  const baseSlug = generateSlug(name);
  if (baseSlug === "") {
    return res.status(400).json({ error: "Invalid library name" });
  }

  generateUniqueSlug(baseSlug, (err, slug) => {
    if (err) {
      return res.status(500).json({ error: "Failed to generate library URL" });
    }

    db.run(
      "INSERT INTO libraries (user_id, name, slug) VALUES (?, ?, ?)",
      [req.user.id, name.trim(), slug],
      function (insertErr) {
        if (insertErr) {
          return res.status(500).json({ error: "Failed to create library" });
        }
        res.status(201).json({
          id: this.lastID,
          user_id: req.user.id,
          name: name.trim(),
          slug,
          message: "Library created successfully",
        });
      }
    );
  });
});

// Get all libraries for authenticated user
app.get("/api/libraries", authenticateToken, (req, res) => {
  db.all(
    "SELECT id, name, slug, created_at FROM libraries WHERE user_id = ? ORDER BY created_at DESC",
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json(rows);
    }
  );
});

// Get a single library by ID (user's libraries only)
app.get("/api/libraries/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get(
    "SELECT id, name, slug, created_at FROM libraries WHERE id = ? AND user_id = ?",
    [id, req.user.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!row) {
        return res.status(404).json({ error: "Library not found" });
      }
      res.json(row);
    }
  );
});

// Update library name
app.put("/api/libraries/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "Library name is required" });
  }

  db.run(
    "UPDATE libraries SET name = ? WHERE id = ? AND user_id = ?",
    [name.trim(), id, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Library not found" });
      }
      res.json({ message: "Library updated successfully" });
    }
  );
});

// Delete library (and all its songs via CASCADE)
app.delete("/api/libraries/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run(
    "DELETE FROM libraries WHERE id = ? AND user_id = ?",
    [id, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Library not found" });
      }
      res.json({ message: "Library deleted successfully" });
    }
  );
});

// Public endpoint to get library by slug (no authentication required)
app.get("/api/public/libraries/:slug", (req, res) => {
  const { slug } = req.params;

  db.get(
    "SELECT id, name, slug, created_at FROM libraries WHERE slug = ?",
    [slug],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!row) {
        return res.status(404).json({ error: "Library not found" });
      }
      res.json(row);
    }
  );
});

// ==================== SONG ENDPOINTS ====================

// Get all songs for a specific library (authenticated users see only their libraries)
app.get("/api/libraries/:libraryId/songs", authenticateToken, (req, res) => {
  const { libraryId } = req.params;
  const { genre, artist, search } = req.query;

  // First verify the library belongs to the user
  db.get(
    "SELECT id FROM libraries WHERE id = ? AND user_id = ?",
    [libraryId, req.user.id],
    (err, library) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!library) {
        return res.status(404).json({ error: "Library not found" });
      }

      let query = "SELECT * FROM songs WHERE library_id = ?";
      const params = [libraryId];

      if (genre) {
        query += " AND genre LIKE ?";
        params.push(`%${genre}%`);
      }

      if (artist) {
        query += " AND artist LIKE ?";
        params.push(`%${artist}%`);
      }

      if (search) {
        query += " AND (title LIKE ? OR artist LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
      }

      query += " ORDER BY artist, title";

      db.all(query, params, (err, rows) => {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }
        res.json(rows);
      });
    }
  );
});

// Public endpoint to get songs from a library by slug (no authentication required)
app.get("/api/public/libraries/:slug/songs", (req, res) => {
  const { slug } = req.query;
  const librarySlug = req.params.slug;
  const { genre, artist, search } = req.query;

  // First get the library by slug
  db.get(
    "SELECT id FROM libraries WHERE slug = ?",
    [librarySlug],
    (err, library) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!library) {
        return res.status(404).json({ error: "Library not found" });
      }

      let query = "SELECT * FROM songs WHERE library_id = ?";
      const params = [library.id];

      if (genre) {
        query += " AND genre LIKE ?";
        params.push(`%${genre}%`);
      }

      if (artist) {
        query += " AND artist LIKE ?";
        params.push(`%${artist}%`);
      }

      if (search) {
        query += " AND (title LIKE ? OR artist LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
      }

      query += " ORDER BY artist, title";

      db.all(query, params, (err, rows) => {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }
        res.json(rows);
      });
    }
  );
});

// Get unique genres from a public library by slug
app.get("/api/public/libraries/:slug/genres", (req, res) => {
  const { slug } = req.params;

  db.get("SELECT id FROM libraries WHERE slug = ?", [slug], (err, library) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    if (!library) {
      return res.status(404).json({ error: "Library not found" });
    }

    db.all(
      "SELECT DISTINCT genre FROM songs WHERE library_id = ? AND genre IS NOT NULL ORDER BY genre",
      [library.id],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }

        const genreSet = new Set();
        rows.forEach((row) => {
          if (row.genre) {
            row.genre.split(",").forEach((genre) => {
              const trimmedGenre = genre.trim();
              if (trimmedGenre) {
                genreSet.add(trimmedGenre);
              }
            });
          }
        });

        const uniqueGenres = Array.from(genreSet).sort();
        res.json(uniqueGenres);
      }
    );
  });
});

// Get unique artists from a public library by slug
app.get("/api/public/libraries/:slug/artists", (req, res) => {
  const { slug } = req.params;

  db.get("SELECT id FROM libraries WHERE slug = ?", [slug], (err, library) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    if (!library) {
      return res.status(404).json({ error: "Library not found" });
    }

    db.all(
      "SELECT DISTINCT artist FROM songs WHERE library_id = ? ORDER BY artist",
      [library.id],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }
        res.json(rows.map((row) => row.artist));
      }
    );
  });
});

// Legacy endpoint - get all songs (deprecated, should use library-specific endpoint)
// This endpoint is kept for backward compatibility but returns empty array
// New code should use /api/libraries/:libraryId/songs
app.get("/api/songs", authenticateToken, (req, res) => {
  res.json([]);
});

// Get unique genres for a library - splits combined genres into individual options
app.get("/api/libraries/:libraryId/genres", authenticateToken, (req, res) => {
  const { libraryId } = req.params;

  // Verify library belongs to user
  db.get(
    "SELECT id FROM libraries WHERE id = ? AND user_id = ?",
    [libraryId, req.user.id],
    (err, library) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!library) {
        return res.status(404).json({ error: "Library not found" });
      }

      db.all(
        "SELECT DISTINCT genre FROM songs WHERE library_id = ? AND genre IS NOT NULL ORDER BY genre",
        [libraryId],
        (err, rows) => {
          if (err) {
            return res.status(500).json({ error: "Database error" });
          }

          const genreSet = new Set();
          rows.forEach((row) => {
            if (row.genre) {
              row.genre.split(",").forEach((genre) => {
                const trimmedGenre = genre.trim();
                if (trimmedGenre) {
                  genreSet.add(trimmedGenre);
                }
              });
            }
          });

          const uniqueGenres = Array.from(genreSet).sort();
          res.json(uniqueGenres);
        }
      );
    }
  );
});

// Get unique artists for a library
app.get("/api/libraries/:libraryId/artists", authenticateToken, (req, res) => {
  const { libraryId } = req.params;

  // Verify library belongs to user
  db.get(
    "SELECT id FROM libraries WHERE id = ? AND user_id = ?",
    [libraryId, req.user.id],
    (err, library) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!library) {
        return res.status(404).json({ error: "Library not found" });
      }

      db.all(
        "SELECT DISTINCT artist FROM songs WHERE library_id = ? ORDER BY artist",
        [libraryId],
        (err, rows) => {
          if (err) {
            return res.status(500).json({ error: "Database error" });
          }
          res.json(rows.map((row) => row.artist));
        }
      );
    }
  );
});

// Get song by ID (verify it belongs to user's library)
app.get(
  "/api/libraries/:libraryId/songs/:id",
  authenticateToken,
  (req, res) => {
    const { libraryId, id } = req.params;

    // Verify library belongs to user and song belongs to library
    db.get(
      `SELECT s.* FROM songs s 
     INNER JOIN libraries l ON s.library_id = l.id 
     WHERE s.id = ? AND s.library_id = ? AND l.user_id = ?`,
      [id, libraryId, req.user.id],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }
        if (!row) {
          return res.status(404).json({ error: "Song not found" });
        }
        res.json(row);
      }
    );
  }
);

// Get songs by artist in a library
app.get(
  "/api/libraries/:libraryId/songs/artist/:artistName",
  authenticateToken,
  (req, res) => {
    const { libraryId, artistName } = req.params;

    // Verify library belongs to user
    db.get(
      "SELECT id FROM libraries WHERE id = ? AND user_id = ?",
      [libraryId, req.user.id],
      (err, library) => {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }
        if (!library) {
          return res.status(404).json({ error: "Library not found" });
        }

        db.all(
          "SELECT * FROM songs WHERE artist = ? AND library_id = ? ORDER BY title",
          [artistName, libraryId],
          (err, rows) => {
            if (err) {
              return res.status(500).json({ error: "Database error" });
            }
            res.json(rows);
          }
        );
      }
    );
  }
);

// Add song to a library
app.post("/api/libraries/:libraryId/songs", authenticateToken, (req, res) => {
  const { libraryId } = req.params;
  const { title, artist, genre, duration, year, album } = req.body;

  if (!title || !artist) {
    return res.status(400).json({ error: "Title and artist are required" });
  }

  // Verify library belongs to user
  db.get(
    "SELECT id FROM libraries WHERE id = ? AND user_id = ?",
    [libraryId, req.user.id],
    (err, library) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!library) {
        return res.status(404).json({ error: "Library not found" });
      }

      db.run(
        "INSERT INTO songs (library_id, title, artist, genre, duration, year, album) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          libraryId,
          title,
          artist,
          genre || null,
          duration || null,
          year || null,
          album || null,
        ],
        function (err) {
          if (err) {
            return res.status(500).json({ error: "Database error" });
          }
          res.json({
            id: this.lastID,
            library_id: libraryId,
            title,
            artist,
            genre,
            duration: duration || null,
            year: year || null,
            album: album || null,
            message: "Song added successfully",
          });
        }
      );
    }
  );
});

// Update song (verify it belongs to user's library)
app.put(
  "/api/libraries/:libraryId/songs/:id",
  authenticateToken,
  (req, res) => {
    const { libraryId, id } = req.params;
    const { title, artist, genre, duration, year, album } = req.body;

    if (!title || !artist) {
      return res.status(400).json({ error: "Title and artist are required" });
    }

    // Verify library belongs to user and song belongs to library
    db.run(
      `UPDATE songs SET title = ?, artist = ?, genre = ?, duration = ?, year = ?, album = ? 
     WHERE id = ? AND library_id = ? 
     AND EXISTS (SELECT 1 FROM libraries WHERE id = ? AND user_id = ?)`,
      [
        title,
        artist,
        genre,
        duration || null,
        year || null,
        album || null,
        id,
        libraryId,
        libraryId,
        req.user.id,
      ],
      function (err) {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: "Song not found" });
        }
        res.json({ message: "Song updated successfully" });
      }
    );
  }
);

// Delete song (verify it belongs to user's library)
app.delete(
  "/api/libraries/:libraryId/songs/:id",
  authenticateToken,
  (req, res) => {
    const { libraryId, id } = req.params;

    // Verify library belongs to user and song belongs to library
    db.run(
      `DELETE FROM songs 
     WHERE id = ? AND library_id = ? 
     AND EXISTS (SELECT 1 FROM libraries WHERE id = ? AND user_id = ?)`,
      [id, libraryId, libraryId, req.user.id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: "Song not found" });
        }
        res.json({ message: "Song deleted successfully" });
      }
    );
  }
);

// MusicBrainz API service for fetching music metadata
class MusicBrainzService {
  constructor() {
    this.baseUrl = "https://musicbrainz.org/ws/2";
    this.userAgent = "KaraokeZen/1.0 (https://karaoke-zen.com)";
    this.cache = new Map();
    this.delay = 1000; // Respect rate limit: 1 request per second
    this.lastRequestTime = 0;
  }

  // Normalize strings for API calls
  normalizeString(str) {
    return str
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^\w\s&'-]/g, "");
  }

  // Rate limiting helper
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.delay) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.delay - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();
  }

  // Convert duration from milliseconds to MM:SS format
  formatDuration(milliseconds) {
    if (!milliseconds || isNaN(milliseconds) || milliseconds <= 0) {
      return null;
    }

    const seconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    // Reject absurdly long durations (over 10 hours)
    if (mins > 10 * 60) return null;

    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  // Extract genres from tags
  extractGenres(tags) {
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return null;
    }

    const genreList = [];
    const seen = new Set();

    for (const tag of tags.slice(0, 10)) {
      const genreName = tag.name?.trim();
      if (
        genreName &&
        !seen.has(genreName.toLowerCase()) &&
        this.isValidGenre(genreName)
      ) {
        genreList.push(genreName);
        seen.add(genreName.toLowerCase());
        if (genreList.length >= 3) break;
      }
    }

    return genreList.length > 0 ? genreList.join(", ") : null;
  }

  // Check if a tag is a valid genre (not a non-genre tag)
  isValidGenre(tag) {
    const lowerTag = tag.toLowerCase();
    const nonGenreTags = [
      "favorite",
      "favorites",
      "favourites",
      "love",
      "loved",
      "awesome",
      "great",
      "good",
      "best",
      "top",
      "epic",
      "amazing",
      "perfect",
      "classic",
      "old",
      "new",
      "recent",
      "popular",
      "hit",
      "single",
      "album",
      "track",
      "song",
      "music",
      "band",
      "artist",
      "group",
      "male vocals",
      "female vocals",
      "vocals",
      "guitar",
      "bass",
      "drums",
      "seen live",
    ];

    return !nonGenreTags.some((nonGenre) => lowerTag.includes(nonGenre));
  }

  // Search for recordings (tracks)
  async searchRecording(artist, title) {
    const cacheKey = `mb-${artist.toLowerCase()}-${title.toLowerCase()}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    await this.waitForRateLimit();

    try {
      const query = `recording:"${this.normalizeString(
        title
      )}" AND artist:"${this.normalizeString(artist)}"`;
      const url = `${this.baseUrl}/recording?query=${encodeURIComponent(
        query
      )}&fmt=json&limit=1&inc=releases+tags`;

      const response = await axios.get(url, {
        headers: {
          "User-Agent": this.userAgent,
        },
        timeout: 8000,
      });

      if (
        !response.data ||
        !response.data.recordings ||
        response.data.recordings.length === 0
      ) {
        return null;
      }

      const recording = response.data.recordings[0];

      // Get release info for album and year
      let album = null;
      let year = null;
      if (recording.releases && recording.releases.length > 0) {
        const release = recording.releases[0];
        album = release.title || null;

        // Try to get release date/year
        if (release.date) {
          const yearMatch = release.date.match(/^(\d{4})/);
          if (yearMatch) {
            year = parseInt(yearMatch[1]);
          }
        }
      }

      // Extract tags/genres
      let genre = null;
      if (recording.tags && recording.tags.length > 0) {
        genre = this.extractGenres(recording.tags);
      }

      const metadata = {
        title: recording.title || title,
        artist: recording["artist-credit"]?.[0]?.artist?.name || artist,
        album: album,
        duration: this.formatDuration(recording.length),
        genre: genre,
        year: year,
        musicbrainz_id: recording.id,
      };

      this.cache.set(cacheKey, metadata);
      return metadata;
    } catch (error) {
      console.log(
        `MusicBrainz API error for ${artist} - ${title}:`,
        error.message
      );
      return null;
    }
  }
}

// Music metadata service using MusicBrainz (primary) and Last.fm (fallback) APIs
class MusicMetadataService {
  constructor(lastfmApiKey) {
    this.lastfmApiKey = lastfmApiKey;
    this.baseUrl = "http://ws.audioscrobbler.com/2.0/";
    this.cache = new Map(); // Simple in-memory cache
    this.musicBrainz = new MusicBrainzService();
  }

  // Helper function to clean and normalize strings for API calls
  normalizeString(str) {
    return str
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^\w\s&'-]/g, ""); // Keep basic punctuation
  }

  // Convert duration from seconds to MM:SS format
  formatDuration(seconds) {
    const sec = Number(seconds);

    // Reject non-numeric, non-positive, or absurdly large values
    if (!Number.isFinite(sec) || sec <= 0) return null;

    // Treat anything over 10 hours as invalid metadata
    if (sec > 10 * 60 * 60) return null;

    const mins = Math.floor(sec / 60);
    const secs = Math.round(sec % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  // Extract genre(s) from Last.fm tags with enhanced specificity
  extractGenres(tags) {
    if (!tags || !Array.isArray(tags) || tags.length === 0) return null;

    // Comprehensive genre priority mapping - specific genres get higher priority
    const genrePriority = {
      // Highly specific subgenres (priority 15-20)
      "punk rock": 20,
      "pop punk": 19,
      grunge: 19,
      "indie rock": 18,
      "alternative rock": 18,
      "progressive rock": 18,
      "hard rock": 17,
      "classic rock": 17,
      "psychedelic rock": 17,
      "garage rock": 17,
      "post-punk": 17,
      "new wave": 17,
      "indie pop": 18,
      "synth-pop": 17,
      "dream pop": 17,
      shoegaze: 17,
      britpop: 17,
      "folk rock": 16,
      "southern rock": 16,
      "glam rock": 16,
      "art rock": 16,

      // Metal subgenres
      "heavy metal": 18,
      "thrash metal": 18,
      "death metal": 18,
      "black metal": 18,
      "power metal": 17,
      "progressive metal": 17,
      "doom metal": 17,
      "nu metal": 17,

      // Electronic subgenres
      house: 16,
      techno: 16,
      trance: 16,
      "drum and bass": 16,
      dubstep: 16,
      ambient: 16,
      downtempo: 15,
      "trip hop": 15,
      idm: 15,

      // Hip-hop subgenres
      "gangsta rap": 17,
      "conscious hip hop": 17,
      trap: 16,
      "old school hip hop": 16,
      "underground hip hop": 16,

      // R&B/Soul subgenres
      "neo soul": 16,
      "contemporary r&b": 15,
      motown: 16,
      "northern soul": 15,

      // Country subgenres
      "country rock": 16,
      "alt country": 16,
      bluegrass: 16,
      "honky tonk": 15,

      // Jazz subgenres
      bebop: 16,
      "smooth jazz": 15,
      fusion: 15,
      swing: 15,

      // Moderate specificity (priority 10-14)
      alternative: 14,
      indie: 13,
      punk: 14,
      metal: 13,
      electronic: 12,
      "hip hop": 12,
      rap: 12,
      "r&b": 11,
      soul: 11,
      funk: 11,
      reggae: 11,
      ska: 12,
      blues: 11,
      folk: 10,
      country: 10,
      jazz: 10,
      classical: 10,
      world: 9,

      // Generic genres (lower priority)
      rock: 8,
      pop: 7,
      dance: 6,
      vocal: 4,
      "singer-songwriter": 8,
      acoustic: 5,
      instrumental: 4,
      soundtrack: 3,
      experimental: 6,
    };

    // Collect all relevant genres with their scores
    const genreScores = new Map();
    const seenGenres = new Set();

    for (const tag of tags.slice(0, 8)) {
      // Check more tags for better accuracy
      const genreName = tag.name.toLowerCase().trim();

      // Skip non-genre tags
      if (this.isNonGenreTag(genreName)) continue;

      // Skip duplicates
      if (seenGenres.has(genreName)) continue;
      seenGenres.add(genreName);

      const score = genrePriority[genreName] || 0;

      if (score > 0) {
        genreScores.set(genreName, score);
      }
    }

    if (genreScores.size === 0) {
      // No valid genre tags found
      return null;
    }

    // Sort by score and get best genres
    const sortedGenres = Array.from(genreScores.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    // Return up to 3 genres - always try to get at least 2 when available
    const selectedGenres = [];
    const primaryScore = sortedGenres[0][1];

    for (let i = 0; i < Math.min(sortedGenres.length, 3); i++) {
      const [genre, score] = sortedGenres[i];

      // More inclusive criteria for multiple genres
      const shouldInclude =
        i === 0 || // Always include primary genre
        (i === 1 && score >= 8 && score >= primaryScore * 0.5) || // More lenient for 2nd genre
        (i === 2 && score >= 10 && score >= primaryScore * 0.6); // Stricter for 3rd genre

      if (shouldInclude) {
        // Check for combinations first (only between first two genres)
        if (i === 1 && selectedGenres.length === 1) {
          const combined = this.combineGenres(
            selectedGenres[0].toLowerCase(),
            genre
          );
          if (combined) {
            selectedGenres[0] = combined; // Replace first genre with combination
            continue;
          }
        }

        selectedGenres.push(this.capitalizeGenre(genre));
      }
    }

    // If we only have one genre and there are more available, try to add a second one
    if (selectedGenres.length === 1 && sortedGenres.length > 1) {
      const secondGenre = sortedGenres[1];
      if (secondGenre[1] >= 6) {
        // Very lenient threshold for second genre
        selectedGenres.push(this.capitalizeGenre(secondGenre[0]));
      }
    }

    // Remove duplicates and return as comma-separated string
    const uniqueGenres = [...new Set(selectedGenres)];
    return uniqueGenres.join(", ");
  }

  // Check if a tag is likely not a music genre
  isNonGenreTag(tag) {
    const nonGenreTags = [
      "seen live",
      "favorite",
      "loved",
      "favorites",
      "love",
      "awesome",
      "great",
      "good",
      "best",
      "top",
      "epic",
      "amazing",
      "perfect",
      "classic",
      "old",
      "new",
      "recent",
      "popular",
      "hit",
      "single",
      "album",
      "track",
      "song",
      "music",
      "band",
      "artist",
      "group",
      "male",
      "female",
      "vocals",
      "guitar",
      "bass",
      "drums",
      "american",
      "british",
      "english",
      "uk",
      "usa",
      "canadian",
      "90s",
      "80s",
      "70s",
      "2000s",
      "2010s", // Decades are handled separately
    ];

    return nonGenreTags.some((nonGenre) => tag.includes(nonGenre));
  }

  // Intelligently combine complementary genres
  combineGenres(primary, secondary) {
    const combinations = {
      // Rock combinations
      punk: { rock: "Punk Rock", alternative: "Alternative Punk" },
      alternative: { rock: "Alternative Rock", metal: "Alternative Metal" },
      indie: { rock: "Indie Rock", pop: "Indie Pop", folk: "Indie Folk" },
      hard: { rock: "Hard Rock" },
      progressive: { rock: "Progressive Rock", metal: "Progressive Metal" },
      folk: { rock: "Folk Rock" },
      pop: { rock: "Pop Rock", punk: "Pop Punk" },

      // Electronic combinations
      synth: { pop: "Synth-Pop", wave: "Synthwave" },
      new: { wave: "New Wave" },
      dream: { pop: "Dream Pop" },

      // Hip-hop combinations
      conscious: { "hip hop": "Conscious Hip Hop", rap: "Conscious Rap" },
      gangsta: { rap: "Gangsta Rap" },
      "old school": { "hip hop": "Old School Hip Hop" },

      // Country combinations
      country: { rock: "Country Rock" },
      alt: { country: "Alt Country" },

      // R&B combinations
      neo: { soul: "Neo Soul" },
      contemporary: { "r&b": "Contemporary R&B" },
      motown: { soul: "Motown" },
      "northern soul": { soul: "Northern Soul" },

      // Jazz combinations
      bebop: { jazz: "Bebop" },
      "smooth jazz": { jazz: "Smooth Jazz" },
      fusion: { jazz: "Fusion" },
      swing: { jazz: "Swing" },
    };

    // Try primary + secondary
    if (combinations[primary] && combinations[primary][secondary]) {
      return combinations[primary][secondary];
    }

    // Try secondary + primary
    if (combinations[secondary] && combinations[secondary][primary]) {
      return combinations[secondary][primary];
    }

    return null;
  }

  // Capitalize genre names properly
  capitalizeGenre(genre) {
    const words = genre.toLowerCase().split(/[\s-]/);
    return words
      .map((word) => {
        if (word === "and") return "&";
        if (word === "r&b" || word === "rb") return "R&B";
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  }

  // Fetch track information from Last.fm
  async fetchTrackInfo(artist, title) {
    const cacheKey = `${artist.toLowerCase()}-${title.toLowerCase()}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const params = new URLSearchParams({
        method: "track.getInfo",
        api_key: this.lastfmApiKey,
        artist: this.normalizeString(artist),
        track: this.normalizeString(title),
        format: "json",
      });

      const response = await axios.get(`${this.baseUrl}?${params}`, {
        timeout: 5000,
      });

      if (response.data.error) {
        console.log(
          `Last.fm API error for ${artist} - ${title}: ${response.data.message}`
        );
        return null;
      }

      const track = response.data.track;
      if (!track) return null;

      const metadata = {
        title: track.name || title,
        artist: track.artist?.name || artist,
        album: track.album?.title || null,
        duration: this.formatDuration(parseInt(track.duration) / 1000),
        genre: this.extractGenres(track.toptags?.tag),
        year: null, // We'll get this from album info
        lastfm_url: track.url,
      };

      // If we have album info, try to get the release year
      if (track.album?.title) {
        try {
          const albumInfo = await this.fetchAlbumInfo(
            track.artist.name,
            track.album.title
          );
          if (albumInfo?.year) {
            metadata.year = albumInfo.year;
          }
        } catch (err) {
          console.log(`Could not fetch album year for ${track.album.title}`);
        }
      }

      this.cache.set(cacheKey, metadata);
      return metadata;
    } catch (error) {
      console.log(
        `Error fetching track info for ${artist} - ${title}:`,
        error.message
      );
      return null;
    }
  }

  // Fetch album information to get release year
  async fetchAlbumInfo(artist, album) {
    try {
      const params = new URLSearchParams({
        method: "album.getInfo",
        api_key: this.lastfmApiKey,
        artist: this.normalizeString(artist),
        album: this.normalizeString(album),
        format: "json",
      });

      const response = await axios.get(`${this.baseUrl}?${params}`, {
        timeout: 5000,
      });

      if (response.data.error || !response.data.album) {
        return null;
      }

      const albumData = response.data.album;
      const releaseDate = albumData.wiki?.published;

      let year = null;
      if (releaseDate) {
        const yearMatch = releaseDate.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
          year = parseInt(yearMatch[0]);
        }
      }

      // Last.fm returns an image array ordered small -> mega. Take the
      // largest one that actually has a URL; entries are often blank.
      let image = null;
      if (Array.isArray(albumData.image)) {
        for (const size of ["extralarge", "large", "medium"]) {
          const match = albumData.image.find(
            (i) => i.size === size && i["#text"]
          );
          if (match) {
            image = match["#text"];
            break;
          }
        }
      }

      return {
        title: albumData.name,
        year: year,
        genre: this.extractGenres(albumData.toptags?.tag),
        image: image,
      };
    } catch (error) {
      console.log(`Error fetching album info:`, error.message);
      return null;
    }
  }

  // Cover art from the iTunes Search API: no key, no rate limit worth
  // worrying about, and it resolves for effectively every mainstream
  // track — which is what a karaoke list is made of.
  async fetchCoverArt(artist, title) {
    try {
      const term = encodeURIComponent(`${artist} ${title}`);
      const response = await axios.get(
        `https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=1`,
        { timeout: 5000 }
      );

      const hit = response.data?.results?.[0];
      if (!hit?.artworkUrl100) return null;

      // The same path serves other sizes; 100px is too small for the UI.
      return hit.artworkUrl100.replace("100x100bb", "400x400bb");
    } catch (error) {
      console.log(`Error fetching cover art:`, error.message);
      return null;
    }
  }

  // Fallback: fetch artist info if track not found
  async fetchArtistInfo(artist) {
    try {
      const params = new URLSearchParams({
        method: "artist.getInfo",
        api_key: this.lastfmApiKey,
        artist: this.normalizeString(artist),
        format: "json",
      });

      const response = await axios.get(`${this.baseUrl}?${params}`, {
        timeout: 5000,
      });

      if (response.data.error || !response.data.artist) {
        return null;
      }

      const artistData = response.data.artist;
      return {
        genre: this.extractGenres(artistData.tags?.tag),
        bio: artistData.bio?.summary,
      };
    } catch (error) {
      console.log(`Error fetching artist info for ${artist}:`, error.message);
      return null;
    }
  }

  // Combine genres from multiple sources to get up to 3 comprehensive genres
  async combineAllGenres(artist, title, album) {
    const allGenres = new Set();
    const genreSources = [];

    // 1. Get track-level genres
    const trackInfo = await this.fetchTrackInfo(artist, title);
    if (trackInfo?.genre && trackInfo.genre !== "Pop") {
      const trackGenres = trackInfo.genre.split(", ").map((g) => g.trim());
      trackGenres.forEach((genre) => {
        allGenres.add(genre);
        genreSources.push({ genre, source: "track", priority: 3 });
      });
    }

    // 2. Get album-level genres (if we have album info and need more genres)
    if (album && allGenres.size < 3) {
      const albumInfo = await this.fetchAlbumInfo(artist, album);
      if (albumInfo?.genre && albumInfo.genre !== "Pop") {
        const albumGenres = albumInfo.genre.split(", ").map((g) => g.trim());
        albumGenres.forEach((genre) => {
          if (!allGenres.has(genre)) {
            allGenres.add(genre);
            genreSources.push({ genre, source: "album", priority: 2 });
          }
        });
      }
    }

    // 3. Get artist-level genres (if we still need more genres)
    if (allGenres.size < 3) {
      const artistInfo = await this.fetchArtistInfo(artist);
      if (artistInfo?.genre && artistInfo.genre !== "Pop") {
        const artistGenres = artistInfo.genre.split(", ").map((g) => g.trim());
        artistGenres.forEach((genre) => {
          if (!allGenres.has(genre)) {
            allGenres.add(genre);
            genreSources.push({ genre, source: "artist", priority: 1 });
          }
        });
      }
    }

    // Sort by priority (track > album > artist) and return up to 3
    const sortedGenres = genreSources
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3)
      .map((item) => item.genre);

    return sortedGenres.length > 0 ? sortedGenres.join(", ") : null;
  }

  // Main method to get complete metadata for a song
  async getCompleteMetadata(artist, title, existingData = {}) {
    // Start with existing data
    const metadata = {
      title: existingData.title || title,
      artist: existingData.artist || artist,
      genre: existingData.genre || null,
      duration: existingData.duration || null,
      year: existingData.year || null,
      album: existingData.album || null,
      musicbrainz_id: existingData.musicbrainz_id || null,
      cover_url: existingData.cover_url || null,
    };

    // Try to fetch from Last.fm if we're missing key information.
    // cover_url counts: a song enriched before album art existed has every
    // other field filled, and would otherwise never get artwork.
    const needsLookup =
      !metadata.genre ||
      !metadata.duration ||
      !metadata.album ||
      !metadata.year ||
      !metadata.cover_url;

    if (needsLookup) {
      // Try MusicBrainz first (primary source)
      const mbMetadata = await this.musicBrainz.searchRecording(artist, title);

      if (mbMetadata) {
        // Fill in missing data from MusicBrainz
        metadata.duration = metadata.duration || mbMetadata.duration;
        metadata.year = metadata.year || mbMetadata.year;
        metadata.album = metadata.album || mbMetadata.album;
        metadata.genre = metadata.genre || mbMetadata.genre;
        metadata.musicbrainz_id =
          metadata.musicbrainz_id || mbMetadata.musicbrainz_id;
      }

      // If still missing data, try Last.fm as fallback
      if (this.lastfmApiKey) {
        const stillMissing =
          !metadata.genre ||
          !metadata.duration ||
          !metadata.album ||
          !metadata.year;

        if (stillMissing) {
          const lastfmInfo = await this.fetchTrackInfo(artist, title);

          if (lastfmInfo) {
            // Fill in only missing fields (don't overwrite MusicBrainz data)
            metadata.duration = metadata.duration || lastfmInfo.duration;
            metadata.year = metadata.year || lastfmInfo.year;
            metadata.album = metadata.album || lastfmInfo.album;
          }

          // Use comprehensive genre detection from Last.fm if still missing genre
          if (!metadata.genre) {
            metadata.genre = await this.combineAllGenres(
              artist,
              title,
              metadata.album
            );
          }
        }
      }

      // Cover art last, once the album name is as good as it is going to get.
      // iTunes first because it needs no key and resolves almost everything;
      // Last.fm's album.getInfo image is the fallback when it does not.
      if (!metadata.cover_url) {
        metadata.cover_url = await this.fetchCoverArt(artist, title);
      }

      if (!metadata.cover_url && this.lastfmApiKey && metadata.album) {
        const albumInfo = await this.fetchAlbumInfo(artist, metadata.album);
        metadata.cover_url = albumInfo?.image || null;
      }
    }

    // Note: genre and duration can remain null - we allow songs without these fields

    return metadata;
  }
}

// Initialize the metadata service
const metadataService = new MusicMetadataService(LASTFM_API_KEY);

// Clean up duplicate songs and refresh all metadata for a library
app.post(
  "/api/libraries/:libraryId/songs/cleanup-and-refresh",
  authenticateToken,
  async (req, res) => {
    try {
      const { libraryId } = req.params;
      const userId = req.user.id;

      // Verify library belongs to user
      const library = await new Promise((resolve, reject) => {
        db.get(
          "SELECT id FROM libraries WHERE id = ? AND user_id = ?",
          [libraryId, userId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!library) {
        return res.status(404).json({ error: "Library not found" });
      }

      // 1. Find and remove duplicates (for this library only)
      const duplicatesQuery = `
      SELECT title, artist, GROUP_CONCAT(id) as ids, COUNT(*) as count
      FROM songs 
      WHERE library_id = ?
      GROUP BY LOWER(TRIM(title)), LOWER(TRIM(artist))
      HAVING COUNT(*) > 1
    `;

      const duplicates = await new Promise((resolve, reject) => {
        db.all(duplicatesQuery, [libraryId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      let duplicatesRemoved = 0;
      for (const duplicate of duplicates) {
        const ids = duplicate.ids.split(",").map((id) => parseInt(id));
        const keepId = Math.min(...ids); // Keep the oldest entry
        const removeIds = ids.filter((id) => id !== keepId);

        for (const removeId of removeIds) {
          await new Promise((resolve, reject) => {
            db.run(
              "DELETE FROM songs WHERE id = ? AND library_id = ?",
              [removeId, libraryId],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
          duplicatesRemoved++;
        }
      }

      // 2. Get all remaining songs (for this library only)
      const allSongs = await new Promise((resolve, reject) => {
        db.all(
          "SELECT * FROM songs WHERE library_id = ? ORDER BY id",
          [libraryId],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      // 3. Refresh metadata for all songs
      let refreshed = 0;
      let errors = [];

      for (const song of allSongs) {
        try {
          const newMetadata = await metadataService.getCompleteMetadata(
            song.artist,
            song.title,
            {
              title: song.title,
              artist: song.artist,
              // Don't pass existing genre to force refresh
              duration: null,
              year: null,
              album: null,
            }
          );

          await new Promise((resolve, reject) => {
            db.run(
              `UPDATE songs SET
             genre = ?,
             duration = ?,
             year = ?,
             album = ?,
             musicbrainz_id = ?,
             cover_url = ?
             WHERE id = ?`,
              [
                newMetadata.genre,
                newMetadata.duration,
                newMetadata.year,
                newMetadata.album,
                newMetadata.musicbrainz_id || null,
                newMetadata.cover_url || null,
                song.id,
              ],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });

          refreshed++;
          console.log(
            `✅ Refreshed: ${song.artist} - ${song.title} → ${newMetadata.genre}`
          );
        } catch (error) {
          console.error(
            `❌ Error refreshing ${song.artist} - ${song.title}:`,
            error.message
          );
          errors.push({
            song: `${song.artist} - ${song.title}`,
            error: error.message,
          });
        }
      }

      res.json({
        message: "Cleanup and refresh completed",
        duplicatesRemoved,
        songsRefreshed: refreshed,
        totalSongs: allSongs.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error("Cleanup and refresh error:", error);
      res.status(500).json({ error: "Failed to cleanup and refresh songs" });
    }
  }
);

// Batch import songs with metadata enrichment for a library
app.post(
  "/api/libraries/:libraryId/songs/batch-import",
  authenticateToken,
  async (req, res) => {
    const { libraryId } = req.params;
    const { songs, autoComplete = false } = req.body;

    if (!songs || !Array.isArray(songs) || songs.length === 0) {
      return res.status(400).json({ error: "Songs array is required" });
    }

    // Verify library belongs to user
    const library = await new Promise((resolve, reject) => {
      db.get(
        "SELECT id FROM libraries WHERE id = ? AND user_id = ?",
        [libraryId, req.user.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!library) {
      return res.status(404).json({ error: "Library not found" });
    }

    const results = {
      success: [],
      errors: [],
      total: songs.length,
      processing_time: Date.now(),
    };

    console.log(
      `Processing batch import of ${songs.length} songs (auto-complete: ${autoComplete})`
    );

    try {
      // Process songs in smaller batches to avoid overwhelming the API
      const batchSize = 5;
      const batches = [];

      for (let i = 0; i < songs.length; i += batchSize) {
        batches.push(songs.slice(i, i + batchSize));
      }

      let globalIndex = 0;

      for (const batch of batches) {
        const batchPromises = batch.map(async (song, batchIndex) => {
          const rowNumber = globalIndex + batchIndex + 1;
          const { title, artist, genre, duration, year, album } = song;

          try {
            // Validate required fields
            if (!title || !artist) {
              return {
                type: "error",
                row: rowNumber,
                error: "Title and artist are required",
                data: song,
              };
            }

            let finalMetadata;

            if (autoComplete) {
              // Use the metadata service to get complete information
              console.log(`Fetching metadata for: ${artist} - ${title}`);
              finalMetadata = await metadataService.getCompleteMetadata(
                artist.trim(),
                title.trim(),
                { genre, duration, year, album }
              );
            } else {
              // Use provided data with minimal validation
              finalMetadata = {
                title: title.trim(),
                artist: artist.trim(),
                genre: genre?.trim() || null,
                duration: duration?.trim() || null,
                year: year || null,
                album: album?.trim() || null,
              };
            }

            // Genre is optional - if not provided, it will be null
            // No validation error needed

            // Insert into database using Promise wrapper
            const insertResult = await new Promise((resolve, reject) => {
              db.run(
                "INSERT INTO songs (library_id, title, artist, genre, duration, year, album, musicbrainz_id, cover_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                  libraryId,
                  finalMetadata.title,
                  finalMetadata.artist,
                  finalMetadata.genre,
                  finalMetadata.duration,
                  finalMetadata.year,
                  finalMetadata.album,
                  finalMetadata.musicbrainz_id || null,
                  finalMetadata.cover_url || null,
                ],
                function (err) {
                  if (err) {
                    reject(err);
                  } else {
                    resolve({
                      id: this.lastID,
                      library_id: libraryId,
                      ...finalMetadata,
                      row: rowNumber,
                    });
                  }
                }
              );
            });

            return {
              type: "success",
              data: insertResult,
            };
          } catch (error) {
            console.error(`Error processing song ${rowNumber}:`, error);
            return {
              type: "error",
              row: rowNumber,
              error: error.message || "Unknown error occurred",
              data: song,
            };
          }
        });

        // Wait for current batch to complete
        const batchResults = await Promise.all(batchPromises);

        // Process results
        batchResults.forEach((result) => {
          if (result.type === "success") {
            results.success.push(result.data);
          } else {
            results.errors.push({
              row: result.row,
              error: result.error,
              data: result.data,
            });
          }
        });

        globalIndex += batch.length;

        // Small delay between batches to be respectful to the API
        if (autoComplete && batches.indexOf(batch) < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      results.processing_time = Date.now() - results.processing_time;
      console.log(`Batch import completed in ${results.processing_time}ms`);
      console.log(
        `Success: ${results.success.length}, Errors: ${results.errors.length}`
      );

      res.json(results);
    } catch (error) {
      console.error("Batch import error:", error);
      res.status(500).json({
        error: "Internal server error during batch import",
        details: error.message,
      });
    }
  }
);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Database connection closed.");
    process.exit(0);
  });
});
