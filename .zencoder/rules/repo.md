# Karaoke Zen - Repository Information

## Project Overview

Karaoke Zen is a full-stack web application designed for managing karaoke song collections. It provides a user-friendly interface for customers to browse and search songs, while giving administrators the ability to manage the song database.

## Architecture

- **Frontend**: React.js with modern hooks and routing
- **Backend**: Node.js with Express.js REST API
- **Database**: SQLite for development (easily upgradeable to PostgreSQL/MySQL)
- **Authentication**: JWT-based admin authentication
- **Styling**: Custom CSS with responsive design

## Directory Structure

```
karaoke-zen/
├── backend/                 # Node.js/Express API server
│   ├── server.js           # Main server file with all routes
│   ├── seedData.js         # Database seeder with sample songs
│   ├── package.json        # Backend dependencies
│   ├── .env                # Environment variables
│   └── karaoke.db          # SQLite database (auto-created)
├── frontend/               # React application
│   ├── public/
│   │   └── index.html      # HTML template
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Navbar.js   # Navigation component
│   │   │   ├── SongList.js # Public song browsing
│   │   │   ├── AdminLogin.js # Admin authentication
│   │   │   └── AdminPanel.js # Song management interface
│   │   ├── App.js          # Main React app component
│   │   ├── App.css         # All styling
│   │   └── index.js        # React entry point
│   └── package.json        # Frontend dependencies
├── package.json            # Root package.json for convenience scripts
├── README.md               # Comprehensive documentation
└── .gitignore              # Git ignore rules

```

## Key Features

### User Features

- Browse all available karaoke songs
- Search by song title or artist name
- Filter songs by genre
- Filter songs by artist
- Responsive design for mobile/desktop

### Admin Features

- Secure login system (JWT authentication)
- Add new songs to the collection
- Edit existing song information
- Delete songs from the collection
- Real-time updates across the interface

## Database Schema

### Songs Table

- id (Primary Key)
- title (Text, Required)
- artist (Text, Required)
- genre (Text, Required)
- created_at (Timestamp)

### Admins Table

- id (Primary Key)
- username (Text, Unique)
- password (Hashed with bcrypt)

## API Endpoints

### Public Endpoints

- `GET /api/songs` - Retrieve songs with optional filtering
- `GET /api/genres` - Get unique genres list
- `GET /api/artists` - Get unique artists list
- `POST /api/auth/login` - Admin authentication

### Protected Endpoints (Admin only)

- `POST /api/songs` - Add new song
- `PUT /api/songs/:id` - Update existing song
- `DELETE /api/songs/:id` - Delete song

## Setup Instructions

1. Install dependencies: `npm run install-all`
2. Seed sample data: `cd backend && npm run seed`
3. Start development: `npm run dev`
4. Access at http://localhost:3000

## Default Admin Credentials

- Username: admin
- Password: admin123

## Development Guidelines

- Use functional React components with hooks
- Follow RESTful API conventions
- Implement proper error handling and validation
- Maintain responsive design principles
- Use semantic HTML and accessible design patterns

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- CORS configuration
- Input validation and sanitization
- SQL injection prevention with parameterized queries

## Scalability Considerations

- SQLite database is suitable for development and small deployments
- Can be upgraded to PostgreSQL or MySQL for production
- Frontend is optimized for performance with React best practices
- API is designed to handle concurrent requests
- Database operations are optimized with proper indexing

## Future Enhancement Ideas

- User favorites/playlist functionality
- Song ratings and popularity tracking
- Advanced search with fuzzy matching
- Bulk song import functionality
- Real-time notifications for new songs
- Multi-admin support with role-based permissions
