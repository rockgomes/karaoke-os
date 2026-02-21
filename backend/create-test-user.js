const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");

// Test user credentials
const testUser = {
  email: "test@karaoke-zen.com",
  username: "testuser",
  password: "test123",
};

async function createTestUser() {
  const db = new sqlite3.Database("./karaoke.db", (err) => {
    if (err) {
      console.error("Error opening database:", err);
      process.exit(1);
    }
    console.log("Connected to database");
  });

  // Initialize database tables (same as server.js)
  await new Promise((resolve, reject) => {
    db.run(
      `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });

  // Check if user already exists
  const existingUser = await new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM users WHERE email = ? OR username = ?",
      [testUser.email, testUser.username],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (existingUser) {
    console.log("❌ Test user already exists!");
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Username: ${testUser.username}`);
    db.close();
    return;
  }

  // Hash password and create user
  const hashedPassword = await bcrypt.hash(testUser.password, 10);

  await new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO users (email, username, password) VALUES (?, ?, ?)",
      [testUser.email, testUser.username, hashedPassword],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });

  console.log("✅ Test user created successfully!");
  console.log("");
  console.log("Credentials:");
  console.log(`   Email: ${testUser.email}`);
  console.log(`   Username: ${testUser.username}`);
  console.log(`   Password: ${testUser.password}`);
  console.log("");
  console.log("You can now login with these credentials.");

  db.close();
}

createTestUser().catch((err) => {
  console.error("Error creating test user:", err);
  process.exit(1);
});



