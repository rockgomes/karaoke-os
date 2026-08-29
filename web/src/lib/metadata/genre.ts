import {
  GENRE_COMBINATIONS,
  GENRE_PRIORITY,
  LASTFM_NON_GENRE,
  MUSICBRAINZ_NON_GENRE,
} from "./tables";

export type Tag = { name: string };

/** Substring match, as in the original: "seen live" also kills "seen live 2019". */
export function isNonGenreTag(tag: string, list: readonly string[]): boolean {
  const lower = tag.toLowerCase();
  return list.some((bad) => lower.includes(bad));
}

export function capitalizeGenre(genre: string): string {
  return genre
    .toLowerCase()
    .split(/[\s-]/)
    .map((word) => {
      if (word === "and") return "&";
      if (word === "r&b" || word === "rb") return "R&B";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function combineGenres(
  primary: string,
  secondary: string,
): string | null {
  return (
    GENRE_COMBINATIONS[primary]?.[secondary] ??
    GENRE_COMBINATIONS[secondary]?.[primary] ??
    null
  );
}

/** MusicBrainz tags: take the first few that are not obviously junk. */
export function extractMusicBrainzGenres(tags?: Tag[]): string | null {
  if (!tags?.length) return null;

  const picked: string[] = [];
  const seen = new Set<string>();

  for (const tag of tags.slice(0, 10)) {
    const name = tag.name?.trim();
    if (!name) continue;
    if (seen.has(name.toLowerCase())) continue;
    if (isNonGenreTag(name, MUSICBRAINZ_NON_GENRE)) continue;

    picked.push(name);
    seen.add(name.toLowerCase());
    if (picked.length >= 3) break;
  }

  return picked.length ? picked.join(", ") : null;
}

/** Last.fm tags: score them, then take up to three. */
export function extractLastfmGenres(tags?: Tag[]): string | null {
  if (!tags?.length) return null;

  const scores = new Map<string, number>();
  const seen = new Set<string>();

  for (const tag of tags.slice(0, 8)) {
    const name = tag.name?.toLowerCase().trim();
    if (!name) continue;
    if (isNonGenreTag(name, LASTFM_NON_GENRE)) continue;
    if (seen.has(name)) continue;
    seen.add(name);

    const score = GENRE_PRIORITY[name] ?? 0;
    if (score > 0) scores.set(name, score);
  }

  if (scores.size === 0) return null;

  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const primaryScore = sorted[0][1];
  const selected: string[] = [];

  for (let i = 0; i < Math.min(sorted.length, 3); i++) {
    const [genre, score] = sorted[i];

    const include =
      i === 0 ||
      (i === 1 && score >= 8 && score >= primaryScore * 0.5) ||
      (i === 2 && score >= 10 && score >= primaryScore * 0.6);

    if (!include) continue;

    // "punk" then "rock" becomes one entry, "Punk Rock".
    if (i === 1 && selected.length === 1) {
      const combined = combineGenres(selected[0].toLowerCase(), genre);
      if (combined) {
        selected[0] = combined;
        continue;
      }
    }

    selected.push(capitalizeGenre(genre));
  }

  // One genre alone reads thin when a decent second is available.
  if (selected.length === 1 && sorted.length > 1 && sorted[1][1] >= 6) {
    selected.push(capitalizeGenre(sorted[1][0]));
  }

  return [...new Set(selected)].join(", ");
}
