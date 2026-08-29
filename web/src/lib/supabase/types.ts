// Database types.
// Regenerate with:  npx supabase gen types typescript --project-id tczjrhcnufvehcthsens
export type Venue = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type AppUser = {
  id: string;
  email: string;
  display_name: string | null;
  is_platform_admin: boolean;
  created_at: string;
};

export type Role = "owner" | "dj";

export type Membership = {
  id: string;
  user_id: string;
  venue_id: string;
  role: Role;
};

export type Library = {
  id: string;
  venue_id: string;
  name: string;
  is_public: boolean;
  created_at: string;
};

export type Difficulty = "easy" | "medium" | "hard";

export type Song = {
  id: string;
  library_id: string;
  title: string;
  artist: string;
  album: string | null;
  genre: string | null;
  duration: string | null;
  year: number | null;
  language: string | null;
  difficulty: Difficulty | null;
  cover_url: string | null;
  musicbrainz_id: string | null;
  created_at: string;
};

export type Session = {
  id: string;
  venue_id: string;
  opened_at: string;
  closed_at: string | null;
};

export type Favorite = {
  user_id: string;
  song_id: string;
  created_at: string;
};

type Table<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      venues: Table<Venue, "name" | "slug">;
      users: Table<AppUser, "id" | "email">;
      memberships: Table<Membership, "user_id" | "venue_id" | "role">;
      libraries: Table<Library, "venue_id" | "name">;
      songs: Table<Song, "library_id" | "title" | "artist">;
      sessions: Table<Session, "venue_id">;
      favorites: Table<Favorite, "user_id" | "song_id">;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
