# 🎤 Karaoke OS

A SaaS (Software as a Service) web application for managing personal karaoke song collections. Features a React frontend and Node.js/Express backend with SQLite database. Each user has their own private song list.

## Features

### For All Users

- 🔐 **User Accounts**: Sign up and log in to access your personal song collection
- 🎵 **Browse Your Songs**: View and manage your own karaoke song list
- 🔍 **Search & Filter**: Search songs by title or artist, filter by genre or artist
- ➕ **Add Songs**: Add new songs to your collection with metadata enrichment
- ✏️ **Edit Songs**: Update song information anytime
- 🗑️ **Delete Songs**: Remove songs from your collection
- 📊 **Batch Import**: Import multiple songs at once via CSV
- 🎭 **Genre Filtering**: Smart genre detection and filtering
- 📱 **Responsive Design**: Works great on mobile and desktop
- 🔒 **Private Collections**: Each user's songs are completely private and secure

## Tech Stack

- **Frontend**: React, React Router, Axios
- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: Custom CSS with modern design

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. **Clone and setup**

   ```bash
   cd karaoke-zen
   npm run install-all
   ```

2. **Start the application**
   ```bash
   npm run dev
   ```

This will start both the backend server (port 5000) and frontend development server (port 3000).

### Manual Setup (Alternative)

If the quick start doesn't work, you can set up manually:

1. **Setup Backend**

   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Setup Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Usage

### Accessing the Application

- **Application**: http://localhost:3000
- **Sign Up**: http://localhost:3000/signup
- **Login**: http://localhost:3000/login

### Getting Started

1. **Create an Account**: Click "Sign Up" to create a new account
   - Enter your email, username, and password
   - Password must be at least 6 characters long
2. **Login**: After creating an account, log in with your email/username and password

3. **Manage Your Songs**:
   - View your songs on the home page
   - Add songs individually or import in bulk via CSV
   - Search and filter your collection
   - Edit or delete songs as needed

### User Functions

1. **View Songs**: See all your songs on the main page
2. **Add Songs**: Click "Manage" in the navbar to add songs
3. **Search**: Use the search box to find specific songs in your collection
4. **Filter by Genre**: Select from genres in your collection
5. **Filter by Artist**: Select from artists in your collection
6. **Batch Import**: Import multiple songs at once with CSV files
7. **Edit/Delete**: Manage your songs through the management panel

## API Endpoints

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user account
- `POST /api/auth/login` - Login with email/username and password
- `GET /api/auth/me` - Get current authenticated user info (protected)

### Protected Endpoints (Require Authentication)

- `GET /api/songs` - Get all songs for the authenticated user (with optional filters)
- `GET /api/genres` - Get unique genres from user's songs
- `GET /api/artists` - Get unique artists from user's songs
- `GET /api/songs/:id` - Get a specific song (user's songs only)
- `POST /api/songs` - Add new song to user's collection
- `PUT /api/songs/:id` - Update song (user's songs only)
- `DELETE /api/songs/:id` - Delete song (user's songs only)
- `POST /api/songs/batch-import` - Import multiple songs at once
- `POST /api/songs/cleanup-and-refresh` - Clean duplicates and refresh metadata

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Songs Table

```sql
CREATE TABLE songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  genre TEXT NOT NULL,
  duration TEXT DEFAULT '3:30',
  year INTEGER,
  album TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Note**: Each song is linked to a user via `user_id`, ensuring complete data isolation between users.

## Configuration

### Environment Variables (Backend)

Create a `.env` file in the backend directory:

```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

### Customization

#### Changing Styles

All styles are in `frontend/src/App.css`. The design uses CSS Grid and Flexbox for responsive layouts.

#### Adding New Features

- Backend routes are in `backend/server.js`
- Frontend components are in `frontend/src/components/`

## Production Deployment

### Build for Production

```bash
cd frontend
npm run build
```

### Environment Setup

1. Change the JWT_SECRET in production to a strong, random secret
2. Consider using PostgreSQL or MySQL for production (instead of SQLite)
3. Set up proper server hosting (PM2, Docker, etc.)
4. Configure CORS appropriately for your domain
5. Set up HTTPS for secure authentication
6. Consider adding rate limiting for API endpoints
7. Set up email verification for new user registrations (optional)

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in package.json scripts if needed
2. **Database errors**: Delete `karaoke.db` file to reset database (⚠️ This will delete all user data)
3. **Authentication issues**: Clear localStorage in browser dev tools
4. **CORS errors**: Ensure backend is running on the configured port
5. **401 Unauthorized errors**: Make sure you're logged in and your token hasn't expired

### Resetting the Application

⚠️ **Warning**: This will delete ALL user data including all user accounts and songs.

```bash
# Stop all processes
# Delete the database file
rm backend/karaoke.db
# Restart the application
npm run dev
# The database will be recreated automatically with empty tables
```

## SaaS Features

This application is designed as a multi-tenant SaaS platform where:

- **User Isolation**: Each user has their own private song collection
- **Secure Authentication**: JWT-based authentication ensures users can only access their own data
- **Scalable Architecture**: Ready to scale to multiple users
- **Future-Ready**: Can easily add features like subscriptions, sharing, collaboration, etc.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions, please create an issue in the repository.

---

**Happy Karaoke! 🎤🎵**
