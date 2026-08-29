import {
  GENRE_COMBINATIONS,
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
