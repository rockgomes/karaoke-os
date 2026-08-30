/**
 * CSV for song lists. Deliberately small: venues export from Excel or a
 * karaoke host program, and those files are plain.
 *
 * When the file has a header row, columns are matched by name and may be in
 * any order. Without one, they are read in the documented order:
 *   title, artist, genre, duration, year, album
 * Only title and artist are required.
 *
 * Reading by position regardless of the header is how a list silently
 * inverts: a venue whose export begins "Artist,Title" would have every song
 * imported with the two swapped, and nothing would look wrong until someone
 * searched for one.
 */

export type ParsedRow = {
  line: number;
  title: string;
  artist: string;
  genre: string | null;
  duration: string | null;
  year: number | null;
  album: string | null;
};

export type SkippedRow = { line: number; reason: string; raw: string };

export type Field = keyof Omit<ParsedRow, "line">;

/**
 * What a column can be called. Matched case-insensitively, ignoring spaces,
 * underscores and hyphens, so "Song Title", "song_title" and "SONGTITLE" all
 * land on the same field.
 */
const HEADER_NAMES: Record<Field, string[]> = {
  title: ["title", "song", "songtitle", "track", "name", "tracktitle"],
  artist: ["artist", "performer", "singer", "band", "artistname"],
  genre: ["genre", "style", "category"],
  duration: ["duration", "length", "time", "runningtime"],
  year: ["year", "released", "releaseyear", "date"],
  album: ["album", "release", "record"],
};

/** The order used when a file has no header row at all. */
const POSITIONAL: Field[] = [
  "title",
  "artist",
  "genre",
  "duration",
  "year",
  "album",
];

const normalise = (value: string) =>
  value.toLowerCase().replace(/[\s_-]+/g, "").replace(/^"|"$/g, "").trim();

/**
 * Which column holds which field, or null when the row is not a header.
 *
 * A row counts as a header only if it names a title and an artist. That
 * keeps a first row of real songs from being eaten: "Africa,Toto" names
 * neither.
 */
export function readHeader(line: string): Partial<Record<Field, number>> | null {
  const cells = splitLine(line).map(normalise);
  const map: Partial<Record<Field, number>> = {};

  for (const [field, names] of Object.entries(HEADER_NAMES) as [
    Field,
    string[],
  ][]) {
    const index = cells.findIndex((cell) => names.includes(cell));
    if (index !== -1) map[field] = index;
  }

  return map.title !== undefined && map.artist !== undefined ? map : null;
}

export type ParseResult = {
  rows: ParsedRow[];
  skipped: SkippedRow[];
  hadHeader: boolean;
};

/** Split one line on commas, respecting quotes and doubled quotes. */
export function splitLine(line: string): string[] {
  const out: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // RFC 4180 writes a literal quote as "". The old parser toggled on
      // every quote, so a field containing one lost the rest of its commas.
      if (inQuotes && line[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      out.push(field.trim());
      field = "";
    } else {
      field += char;
    }
  }

  out.push(field.trim());
  return out;
}

const clean = (value: string | undefined): string | null => {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
};

export function parseCsv(text: string): ParseResult {
  // Excel writes a byte order mark and CRLF line endings. Both are normal in
  // a file a venue actually sends, and both broke the old parser.
  const body = text.replace(/^\ufeff/, "").replace(/\r\n?/g, "\n");
  const lines = body.split("\n");

  const rows: ParsedRow[] = [];
  const skipped: SkippedRow[] = [];

  const header = readHeader(lines[0] ?? "");
  const hadHeader = header !== null;

  /*
   * A column is wherever the header says it is. For a field the header does
   * not name, fall back to the documented position — a file whose header
   * reads "Song,Performer" but which also carries genre and year still
   * imports them.
   *
   * The dangerous case cannot come back through that fallback: a row only
   * counts as a header if it names both title and artist, so those two are
   * always matched by name and can never be swapped by position.
   */
  const at = (columns: string[], field: Field) => {
    const named = header?.[field];
    const index = named !== undefined ? named : POSITIONAL.indexOf(field);
    return index < 0 ? null : clean(columns[index]);
  };

  for (let i = hadHeader ? 1 : 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) continue;

    const columns = splitLine(line);
    const title = at(columns, "title");
    const artist = at(columns, "artist");

    if (!title || !artist) {
      skipped.push({
        line: i + 1,
        reason:
          !title && !artist ? "no title or artist" : !title ? "no title" : "no artist",
        raw: line.slice(0, 90),
      });
      continue;
    }

    const yearRaw = at(columns, "year");
    let year: number | null = null;
    if (yearRaw) {
      const parsed = Number.parseInt(yearRaw, 10);
      year = Number.isInteger(parsed) && parsed >= 1850 && parsed <= 2100 ? parsed : null;
    }

    rows.push({
      line: i + 1,
      title,
      artist,
      genre: at(columns, "genre"),
      duration: at(columns, "duration"),
      year,
      album: at(columns, "album"),
    });
  }

  return { rows, skipped, hadHeader };
}

/** Case-insensitive key for spotting a song the venue already has. */
export function songKey(title: string, artist: string): string {
  return `${title.trim().toLowerCase()} ${artist.trim().toLowerCase()}`;
}
