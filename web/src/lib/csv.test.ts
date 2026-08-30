import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parseCsv, readHeader, songKey, splitLine } from "./csv.ts";

// The two files a real venue would send, kept at the repo root.
const read = (name: string) => readFileSync(new URL(`../../../${name}`, import.meta.url), "utf8");

test("splitLine keeps commas inside quotes", () => {
  assert.deepEqual(splitLine("a,b,c"), ["a", "b", "c"]);
  assert.deepEqual(splitLine('"1, 2 Step",Ciara'), ["1, 2 Step", "Ciara"]);
  assert.deepEqual(splitLine("a,,,d"), ["a", "", "", "d"]);
});

test("splitLine reads a doubled quote as one literal quote", () => {
  // The old parser toggled on every quote, so a field containing one lost
  // the rest of its commas.
  assert.deepEqual(splitLine('"He said ""hi""",X'), ['He said "hi"', "X"]);
});

test("splitLine leaves apostrophes alone", () => {
  assert.deepEqual(splitLine(`"Sweet Child O' Mine","Guns N' Roses"`), [
    "Sweet Child O' Mine",
    "Guns N' Roses",
  ]);
});

test("parses the comma-heavy sample", () => {
  const result = parseCsv(read("test-comma-songs.csv"));
  assert.equal(result.hadHeader, true);
  assert.equal(result.rows.length, 5);
  assert.equal(result.rows[1].title, "5, 6, 7, 8");
  assert.equal(result.rows[0].artist, "Ciara Feat. Missy Elliott");
});

test("parses the full sample", () => {
  const result = parseCsv(read("sample-songs.csv"));
  assert.equal(result.rows.length, 20);
  assert.equal(result.rows[0].year, 2014);
  assert.equal(result.rows[0].genre, null, "an empty column is null, not an empty string");
  assert.equal(result.rows[3].album, "A Night at the Opera");
});

test("survives what Excel writes", () => {
  assert.equal(parseCsv("title,artist\r\nA,B\r\n").rows.length, 1, "CRLF");
  assert.equal(parseCsv("﻿title,artist\nA,B").rows.length, 1, "byte order mark");
});

test("a file with no header loses no rows", () => {
  assert.equal(parseCsv("A,B\nC,D").rows.length, 2);
});

test("a row missing title or artist is reported, not silently dropped", () => {
  const result = parseCsv("title,artist\nOnlyTitle,\n,OnlyArtist\n");
  assert.equal(result.rows.length, 0);
  assert.deepEqual(
    result.skipped.map((s) => s.reason),
    ["no artist", "no title"],
  );
});

test("an unusable year becomes null rather than NaN", () => {
  assert.equal(parseCsv("title,artist\nA,B,,,notayear").rows[0].year, null);
  assert.equal(parseCsv("title,artist\nA,B,,,1200").rows[0].year, null);
  assert.equal(parseCsv("title,artist\nA,B,,,1975").rows[0].year, 1975);
});

test("songKey ignores case and surrounding space", () => {
  assert.equal(songKey(" Africa ", "TOTO"), songKey("africa", "Toto"));
  assert.notEqual(songKey("Africa", "Toto"), songKey("Africa", "Weezer"));
});

test("a header in a different order does not invert the list", () => {
  // The bug this exists to stop: read by position and every song comes in
  // with the artist and the title the wrong way round, silently.
  const { rows, hadHeader } = parseCsv("Artist,Title\nToto,Africa");
  assert.equal(hadHeader, true);
  assert.equal(rows[0].title, "Africa");
  assert.equal(rows[0].artist, "Toto");
});

test("columns are found by name wherever they sit", () => {
  const { rows } = parseCsv(
    "Year,Performer,Album,Song,Genre,Length\n1982,Toto,Toto IV,Africa,Rock,4:55",
  );
  assert.deepEqual(
    { ...rows[0], line: undefined },
    {
      line: undefined,
      title: "Africa",
      artist: "Toto",
      genre: "Rock",
      duration: "4:55",
      year: 1982,
      album: "Toto IV",
    },
  );
});

test("header names ignore case, spaces and underscores", () => {
  const { rows } = parseCsv("SONG_TITLE, Artist Name\nAfrica,Toto");
  assert.equal(rows[0].title, "Africa");
  assert.equal(rows[0].artist, "Toto");
});

test("a first row of real songs is not eaten as a header", () => {
  // "Africa,Toto" names no columns, so it is data and must survive.
  const { rows, hadHeader } = parseCsv("Africa,Toto\nMamma Mia,ABBA");
  assert.equal(hadHeader, false);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].title, "Africa");
});

test("a header naming only some columns still reads the rest by position", () => {
  const { rows } = parseCsv("Song,Artist\nAfrica,Toto,Rock,4:55,1982,Toto IV");
  assert.equal(rows[0].genre, "Rock");
  assert.equal(rows[0].year, 1982);
  assert.equal(rows[0].album, "Toto IV");
});

test("readHeader needs both a title and an artist column", () => {
  assert.equal(readHeader("Title,Genre,Year"), null);
  assert.equal(readHeader("Artist,Genre"), null);
  assert.notEqual(readHeader("Title,Artist"), null);
});
