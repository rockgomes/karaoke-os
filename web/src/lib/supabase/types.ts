// Database types.
// Regenerate with:  npx supabase gen types typescript --project-id tczjrhcnufvehcthsens
export type Venue = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  suspended_at: string | null;
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
    Functions: {
      // Creating a venue and its first membership must be one transaction.
      // See the create_venue_rpc migration for why.
      create_venue: {
        Args: { venue_name: string; venue_slug: string };
        Returns: Venue;
      };
      // Refuses anyone who is not platform staff. See the platform_overview_rpc
      // migration for why this is a function and not a view.
      platform_venues: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          suspended_at: string | null;
          owner_email: string | null;
          staff_count: number;
          song_count: number;
          karaoke_open: boolean;
        }[];
      };
      set_venue_suspended: {
        Args: { target_venue: string; suspended: boolean };
        Returns: Venue;
      };
      // Splits the comma-joined genre column and counts the labels, so the
      // filter can be built without shipping every song to the browser.
      library_genres: {
        Args: { target_library: string };
        Returns: { genre: string; songs: number }[];
      };
      // The genres a guest can filter by, across a venue's public libraries.
      // Callable by signed-out visitors; RLS decides what it counts.
      venue_genres: {
        Args: { target_venue: string };
        Returns: { genre: string; songs: number }[];
      };
      // The four venue admin numbers in one round trip. "Added this week" uses
      // the database clock, so the count does not shift between renders.
      library_stats: {
        Args: { target_library: string };
        Returns: {
          total: number;
          incomplete: number;
          added_this_week: number;
          genres: number;
        }[];
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
