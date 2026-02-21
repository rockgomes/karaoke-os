/**
 * Mock data for testing
 * Centralized location for all test fixtures
 */

export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
};

export const mockLibrary = {
  id: 1,
  name: 'Test Library',
  slug: 'test-library',
  user_id: 1,
};

export const mockSong = {
  id: 1,
  title: 'Test Song',
  artist: 'Test Artist',
  genre: 'Pop',
  duration: '3:45',
  year: 2024,
  album: 'Test Album',
  library_id: 1,
};

export const mockSongs = [
  {
    id: 1,
    title: 'Song A',
    artist: 'Artist A',
    genre: 'Pop',
    duration: '3:30',
    year: 2024,
    album: 'Album A',
  },
  {
    id: 2,
    title: 'Song B',
    artist: 'Artist B',
    genre: 'Rock',
    duration: '4:15',
    year: 2023,
    album: 'Album B',
  },
  {
    id: 3,
    title: 'Song C',
    artist: 'Artist C',
    genre: 'Jazz',
    duration: '5:00',
    year: 2022,
    album: 'Album C',
  },
];

export const mockLibraries = [
  {
    id: 1,
    name: 'Main Library',
    slug: 'main-library',
    user_id: 1,
  },
  {
    id: 2,
    name: 'Secondary Library',
    slug: 'secondary-library',
    user_id: 1,
  },
];

// Mock AI-enhanced song (with metadata from MusicBrainz/Last.fm)
export const mockAISong = {
  id: 4,
  title: 'Bohemian Rhapsody',
  artist: 'Queen',
  genre: 'Rock',
  duration: '5:55',
  year: 1975,
  album: 'A Night at the Opera',
  ai_enhanced: true,
  ai_source: 'musicbrainz',
};

// Helper function to create mock songs
export const createMockSong = (overrides = {}) => ({
  ...mockSong,
  ...overrides,
});

// Helper function to create multiple mock songs
export const createMockSongs = (count = 3) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    title: `Song ${String.fromCharCode(65 + index)}`,
    artist: `Artist ${String.fromCharCode(65 + index)}`,
    genre: ['Pop', 'Rock', 'Jazz', 'Country', 'Hip Hop'][index % 5],
    duration: `${Math.floor(Math.random() * 3) + 3}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    year: 2020 + (index % 5),
    album: `Album ${String.fromCharCode(65 + index)}`,
  }));
};
