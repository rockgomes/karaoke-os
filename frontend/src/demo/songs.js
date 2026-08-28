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
  { title: "Dancing Queen", artist: "ABBA", genre: "Pop", duration: "3:52", year: 1976, album: "Arrival" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/60/f8/a6/60f8a6bc-e875-238d-f2f8-f34a6034e6d2/14UMGIM07615.rgb.jpg/400x400bb.jpg" },
  { title: "Don't Stop Believin'", artist: "Journey", genre: "Rock", duration: "4:11", year: 1981, album: "Escape" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/71/2d/61/712d617d-f4a4-5904-1b11-d4b4b45c47c5/828768588925.jpg/400x400bb.jpg" },
  { title: "I Will Survive", artist: "Gloria Gaynor", genre: "Disco", duration: "3:15", year: 1978, album: "Love Tracks" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/33/12/df/3312dfbf-2cd2-e149-1ccb-9688e2a60980/00731454913720.rgb.jpg/400x400bb.jpg" },
  { title: "Wonderwall", artist: "Oasis", genre: "Britpop", duration: "4:18", year: 1995, album: "Morning Glory" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/04/92/e0/0492e08b-cbcc-9969-9ad6-8f5a0888068c/5051961007107.jpg/400x400bb.jpg" },
  { title: "Total Eclipse of the Heart", artist: "Bonnie Tyler", genre: "Pop", duration: "5:32", year: 1983, album: "Faster Than the Speed of Night" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/20/74/b8/2074b81d-d546-b0c2-d85b-dda3a5e17661/886448236856.jpg/400x400bb.jpg" },
  { title: "Livin' on a Prayer", artist: "Bon Jovi", genre: "Rock", duration: "4:09", year: 1986, album: "Slippery When Wet" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/40/16/3e/40163e24-6985-b785-d4ea-cbae07d74812/06UMGIM05422.rgb.jpg/400x400bb.jpg" },
  { title: "Valerie", artist: "Mark Ronson", genre: "Soul", duration: "3:41", year: 2007, album: "Version" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music/a2/5e/db/mzi.wnhqfawi.jpg/400x400bb.jpg" },
  { title: "Rolling in the Deep", artist: "Adele", genre: "Soul", duration: "3:48", year: 2010, album: "21" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/eb/ca/25/ebca2596-cd1e-b295-91a3-771c868d0a79/191404113868.png/400x400bb.jpg" },
  { title: "Mr. Brightside", artist: "The Killers", genre: "Rock", duration: "3:42", year: 2003, album: "Hot Fuss" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/11/64/9c/11649c80-2066-dba8-77a9-df7eecae26c1/17UM1IM06937.rgb.jpg/400x400bb.jpg" },
  { title: "Superstition", artist: "Stevie Wonder", genre: "Funk", duration: "4:26", year: 1972, album: "Talking Book" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/62/61/61/626161c0-f4d7-e6ff-8586-768340ef278f/00602537002382.rgb.jpg/400x400bb.jpg" },
  { title: "Take On Me", artist: "a-ha", genre: "Synthpop", duration: "3:46", year: 1985, album: "Hunting High and Low" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music/c6/e1/c8/mzi.ixgzfcmc.jpg/400x400bb.jpg" },
  { title: "Creep", artist: "Radiohead", genre: "Alternative", duration: "3:58", year: 1992, album: "Pablo Honey" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/28/7a/7c/287a7ca9-ed95-1a21-e3bb-4559a1a0ac0e/191404134351.png/400x400bb.jpg" },
  { title: "Respect", artist: "Aretha Franklin", genre: "Soul", duration: "2:28", year: 1967, album: "I Never Loved a Man" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/d1/31/ee/d131eec4-614c-d661-b580-3dc32b8547e8/603497896622.jpg/400x400bb.jpg" },
  { title: "Sweet Caroline", artist: "Neil Diamond", genre: "Pop", duration: "3:21", year: 1969, album: "Brother Love's Travelling Salvation Show" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/11/5a/12/115a123b-d3b6-b661-e2a3-88d6e137e25a/17UMGIM03521.rgb.jpg/400x400bb.jpg" },
  { title: "Zombie", artist: "The Cranberries", genre: "Alternative", duration: "5:06", year: 1994, album: "No Need to Argue" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a3/77/a3/a377a309-8e52-f787-2250-2b34d320bf7b/25UMGIM64146.rgb.jpg/400x400bb.jpg" },
  { title: "Girls Just Want to Have Fun", artist: "Cyndi Lauper", genre: "Pop", duration: "3:58", year: 1983, album: "She's So Unusual" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/8a/8c/13/8a8c13e0-06af-1710-7b7d-ebec65fb8361/074643893022.jpg/400x400bb.jpg" },
  { title: "Ain't No Mountain High Enough", artist: "Marvin Gaye", genre: "Soul", duration: "2:24", year: 1967, album: "United" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/9b/c1/cf/9bc1cf3a-84c7-474e-2d0f-2e4bd0327377/06UMGIM11763.rgb.jpg/400x400bb.jpg" },
  { title: "Wannabe", artist: "Spice Girls", genre: "Pop", duration: "2:53", year: 1996, album: "Spice" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e1/92/8f/e1928fcb-0204-ca19-597a-6edaf8e6ebc8/21UMGIM16233.rgb.jpg/400x400bb.jpg" },
  { title: "Chandelier", artist: "Sia", genre: "Pop", duration: "3:36", year: 2014, album: "1000 Forms of Fear" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/00/bf/72/00bf72a2-3e50-e5e7-ae78-dc35bbf9bcda/886444578219.jpg/400x400bb.jpg" },
  { title: "Hey Ya!", artist: "OutKast", genre: "Hip hop", duration: "3:55", year: 2003, album: "Speakerboxxx/The Love Below" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a3/35/54/a33554b6-4122-cdfd-29e8-d17897280263/dj.yiwizfgg.jpg/400x400bb.jpg" },
  { title: "Nothing Compares 2 U", artist: "Sinéad O'Connor", genre: "Pop", duration: "5:10", year: 1990, album: "I Do Not Want What I Haven't Got" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/fa/19/3f/fa193fc7-f9cf-c84e-c7ef-77b2fceb3a3e/5054526647565.png/400x400bb.jpg" },
  { title: "Africa", artist: "Toto", genre: "Rock", duration: "4:55", year: 1982, album: "Toto IV" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/69/ce/d2/69ced240-07a7-2a04-bbab-2afbacf30809/074643772822.jpg/400x400bb.jpg" },
  { title: "Crazy", artist: "Gnarls Barkley", genre: "Soul", duration: "2:58", year: 2006, album: "St. Elsewhere" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/fc/6e/1e/fc6e1e95-7f93-09d8-455e-2f24a537a71f/603497823703.jpg/400x400bb.jpg" },
  { title: "Bohemian Rhapsody", artist: "Queen", genre: "Rock", duration: "5:55", year: 1975, album: "A Night at the Opera" , cover_url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/4d/08/2a/4d082a9e-7898-1aa1-a02f-339810058d9e/14DMGIM05632.rgb.jpg/400x400bb.jpg" },
].map((s, i) => ({
  id: i + 1,
  library_id: DEMO_LIBRARY.id,
  created_at: "2026-01-12T20:00:00.000Z",
  ...s,
}));
