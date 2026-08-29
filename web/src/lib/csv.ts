/**
 * CSV for song lists. Deliberately small: venues export from Excel or a
 * karaoke host program, and those files are plain.
 *
 * Column order, as in the old importer:
 *   title, artist, genre, duration, year, album
 * Only the first two are required.
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
  const body = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const lines = body.split("\n");

  const rows: ParsedRow[] = [];
  const skipped: SkippedRow[] = [];

  const first = (lines[0] ?? "").toLowerCase();
  const hadHeader =
    first.includes("title") || first.includes("artist") || first.includes("song");

  for (let i = hadHeader ? 1 : 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) continue;

    const columns = splitLine(line);
    const title = clean(columns[0]);
    const artist = clean(columns[1]);

    if (!title || !artist) {
      skipped.push({
        line: i + 1,
        reason:
          !title && !artist ? "no title or artist" : !title ? "no title" : "no artist",
        raw: line.slice(0, 90),
      });
      continue;
    }

    const yearRaw = clean(columns[4]);
    let year: number | null = null;
    if (yearRaw) {
      const parsed = Number.parseInt(yearRaw, 10);
      year = Number.isInteger(parsed) && parsed >= 1850 && parsed <= 2100 ? parsed : null;
    }

    rows.push({
      line: i + 1,
      title,
      artist,
      genre: clean(columns[2]),
      duration: clean(columns[3]),
      year,
      album: clean(columns[5]),
    });
  }

  return { rows, skipped, hadHeader };
}

/** Case-insensitive key for spotting a song the venue already has. */
export function songKey(title: string, artist: string): string {
  return `${title.trim().toLowerCase()} ${artist.trim().toLowerCase()}`;
}
