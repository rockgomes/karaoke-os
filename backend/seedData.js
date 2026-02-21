const sqlite3 = require("sqlite3").verbose();

// Sample songs to populate the database
const sampleSongs = [
  {
    title: "Don't Stop Believin'",
    artist: "Journey",
    genre: "Rock",
    duration: "4:11",
    year: 1981,
    album: "Escape",
  },
  {
    title: "Sweet Caroline",
    artist: "Neil Diamond",
    genre: "Pop",
    duration: "3:21",
    year: 1969,
    album: "Brother Love's Travelling Salvation Show",
  },
  {
    title: "Bohemian Rhapsody",
    artist: "Queen",
    genre: "Rock",
    duration: "5:55",
    year: 1975,
    album: "A Night at the Opera",
  },
  {
    title: "I Will Survive",
    artist: "Gloria Gaynor",
    genre: "Disco",
    duration: "3:17",
    year: 1978,
    album: "Love Tracks",
  },
  {
    title: "Livin' on a Prayer",
    artist: "Bon Jovi",
    genre: "Rock",
    duration: "4:10",
    year: 1986,
    album: "Slippery When Wet",
  },
  {
    title: "My Way",
    artist: "Frank Sinatra",
    genre: "Jazz",
    duration: "4:35",
    year: 1969,
    album: "My Way",
  },
  {
    title: "Imagine",
    artist: "John Lennon",
    genre: "Pop",
    duration: "3:07",
    year: 1971,
    album: "Imagine",
  },
  {
    title: "Hotel California",
    artist: "Eagles",
    genre: "Rock",
    duration: "6:30",
    year: 1976,
    album: "Hotel California",
  },
  {
    title: "Dancing Queen",
    artist: "ABBA",
    genre: "Pop",
    duration: "3:51",
    year: 1976,
    album: "Arrival",
  },
  {
    title: "I Want It That Way",
    artist: "Backstreet Boys",
    genre: "Pop",
    duration: "3:33",
    year: 1999,
    album: "Millennium",
  },
  {
    title: "Wonderwall",
    artist: "Oasis",
    genre: "Alternative",
    duration: "4:18",
    year: 1995,
    album: "(What's the Story) Morning Glory?",
  },
  {
    title: "Mr. Brightside",
    artist: "The Killers",
    genre: "Alternative",
    duration: "3:42",
    year: 2003,
    album: "Hot Fuss",
  },
  {
    title: "Summer of '69",
    artist: "Bryan Adams",
    genre: "Rock",
    duration: "3:34",
    year: 1984,
    album: "Reckless",
  },
  {
    title: "Total Eclipse of the Heart",
    artist: "Bonnie Tyler",
    genre: "Rock",
    duration: "7:02",
    year: 1983,
    album: "Faster Than the Speed of Night",
  },
  {
    title: "I Will Always Love You",
    artist: "Whitney Houston",
    genre: "R&B",
    duration: "4:31",
    year: 1992,
    album: "The Bodyguard Soundtrack",
  },
  {
    title: "Can't Help Myself",
    artist: "Four Tops",
    genre: "Soul",
    duration: "2:44",
    year: 1965,
    album: "Four Tops Second Album",
  },
  {
    title: "Respect",
    artist: "Aretha Franklin",
    genre: "R&B",
    duration: "2:28",
    year: 1967,
    album: "I Never Loved a Man the Way I Love You",
  },
  {
    title: "Billie Jean",
    artist: "Michael Jackson",
    genre: "Pop",
    duration: "4:54",
    year: 1983,
    album: "Thriller",
  },
  {
    title: "Sweet Child O' Mine",
    artist: "Guns N' Roses",
    genre: "Rock",
    duration: "5:03",
    year: 1987,
    album: "Appetite for Destruction",
  },
  {
    title: "Every Rose Has Its Thorn",
    artist: "Poison",
    genre: "Rock",
    duration: "4:20",
    year: 1988,
    album: "Open Up and Say... Ahh!",
  },
];

function seedDatabase() {
  const db = new sqlite3.Database("./karaoke.db", (err) => {
    if (err) {
      console.error("Error opening database:", err);
      return;
    }
    console.log("Connected to SQLite database for seeding");
  });

  // Check if songs already exist
  db.get("SELECT COUNT(*) as count FROM songs", (err, row) => {
    if (err) {
      console.error("Error checking existing songs:", err);
      return;
    }

    if (row.count > 0) {
      console.log(`Database already has ${row.count} songs. Skipping seed.`);
      db.close();
      return;
    }

    console.log("Seeding database with sample songs...");

    const stmt = db.prepare(
      "INSERT INTO songs (title, artist, genre, duration, year, album) VALUES (?, ?, ?, ?, ?, ?)"
    );

    sampleSongs.forEach((song, index) => {
      stmt.run(
        [
          song.title,
          song.artist,
          song.genre,
          song.duration,
          song.year,
          song.album,
        ],
        (err) => {
          if (err) {
            console.error(`Error inserting song ${song.title}:`, err);
          } else {
            console.log(`✓ Added: ${song.title} by ${song.artist}`);
          }

          // Close database after last song
          if (index === sampleSongs.length - 1) {
            stmt.finalize();
            db.close((err) => {
              if (err) {
                console.error("Error closing database:", err);
              } else {
                console.log("\n🎵 Database seeded successfully!");
                console.log(`Added ${sampleSongs.length} sample songs.`);
                console.log(
                  "You can now start the server and begin using the application."
                );
              }
            });
          }
        }
      );
    });
  });
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleSongs };
