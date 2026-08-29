import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parseCsv, songKey, splitLine } from "./csv.ts";

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
