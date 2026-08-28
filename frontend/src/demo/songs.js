// Seed data for demo mode. Plain karaoke standards, nothing personal.
export const DEMO_USER = {
  id: 1,
  username: "demo",
  email: "demo@karaoke.demo",
};

export const DEMO_LIBRARY = {
  id: 1,
  user_id: 1,
  name: "Friday Night List",
  slug: "friday-night",
  created_at: "2026-01-12T20:00:00.000Z",
};

export const DEMO_SONGS = [
  { title: "Dancing Queen", artist: "ABBA", genre: "Pop", duration: "3:52", year: 1976, album: "Arrival" },
  { title: "Don't Stop Believin'", artist: "Journey", genre: "Rock", duration: "4:11", year: 1981, album: "Escape" },
  { title: "I Will Survive", artist: "Gloria Gaynor", genre: "Disco", duration: "3:15", year: 1978, album: "Love Tracks" },
  { title: "Wonderwall", artist: "Oasis", genre: "Britpop", duration: "4:18", year: 1995, album: "Morning Glory" },
  { title: "Total Eclipse of the Heart", artist: "Bonnie Tyler", genre: "Pop", duration: "5:32", year: 1983, album: "Faster Than the Speed of Night" },
  { title: "Livin' on a Prayer", artist: "Bon Jovi", genre: "Rock", duration: "4:09", year: 1986, album: "Slippery When Wet" },
  { title: "Valerie", artist: "Mark Ronson", genre: "Soul", duration: "3:41", year: 2007, album: "Version" },
  { title: "Rolling in the Deep", artist: "Adele", genre: "Soul", duration: "3:48", year: 2010, album: "21" },
  { title: "Mr. Brightside", artist: "The Killers", genre: "Rock", duration: "3:42", year: 2003, album: "Hot Fuss" },
  { title: "Superstition", artist: "Stevie Wonder", genre: "Funk", duration: "4:26", year: 1972, album: "Talking Book" },
  { title: "Take On Me", artist: "a-ha", genre: "Synthpop", duration: "3:46", year: 1985, album: "Hunting High and Low" },
  { title: "Creep", artist: "Radiohead", genre: "Alternative", duration: "3:58", year: 1992, album: "Pablo Honey" },
  { title: "Respect", artist: "Aretha Franklin", genre: "Soul", duration: "2:28", year: 1967, album: "I Never Loved a Man" },
  { title: "Sweet Caroline", artist: "Neil Diamond", genre: "Pop", duration: "3:21", year: 1969, album: "Brother Love's Travelling Salvation Show" },
  { title: "Zombie", artist: "The Cranberries", genre: "Alternative", duration: "5:06", year: 1994, album: "No Need to Argue" },
  { title: "Girls Just Want to Have Fun", artist: "Cyndi Lauper", genre: "Pop", duration: "3:58", year: 1983, album: "She's So Unusual" },
  { title: "Ain't No Mountain High Enough", artist: "Marvin Gaye", genre: "Soul", duration: "2:24", year: 1967, album: "United" },
  { title: "Wannabe", artist: "Spice Girls", genre: "Pop", duration: "2:53", year: 1996, album: "Spice" },
  { title: "Chandelier", artist: "Sia", genre: "Pop", duration: "3:36", year: 2014, album: "1000 Forms of Fear" },
  { title: "Hey Ya!", artist: "OutKast", genre: "Hip hop", duration: "3:55", year: 2003, album: "Speakerboxxx/The Love Below" },
  { title: "Nothing Compares 2 U", artist: "Sinéad O'Connor", genre: "Pop", duration: "5:10", year: 1990, album: "I Do Not Want What I Haven't Got" },
  { title: "Africa", artist: "Toto", genre: "Rock", duration: "4:55", year: 1982, album: "Toto IV" },
  { title: "Crazy", artist: "Gnarls Barkley", genre: "Soul", duration: "2:58", year: 2006, album: "St. Elsewhere" },
  { title: "Bohemian Rhapsody", artist: "Queen", genre: "Rock", duration: "5:55", year: 1975, album: "A Night at the Opera" },
].map((s, i) => ({
  id: i + 1,
  library_id: DEMO_LIBRARY.id,
  created_at: "2026-01-12T20:00:00.000Z",
  ...s,
}));
