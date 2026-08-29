#!/usr/bin/env node
// Prints the screen list from docs/MAP.md as tab-indented plain text.
//
// Outliners (Xmind, Workflowy, MindNode) build their hierarchy from TAB
// characters, not from markdown bullets. Pasting "* item" with two-space
// indents gives one flat row with literal asterisks in it.
//
//   node scripts/outline.mjs | pbcopy
//
// then paste into the Xmind outliner.

import { readFile } from "node:fs/promises";

const map = await readFile("docs/MAP.md", "utf8");

const section = map.match(/## 0\. Screens at a glance\n([\s\S]*?)\n---/);
if (!section) {
  console.error("docs/MAP.md has no '## 0. Screens at a glance' section.");
  process.exit(1);
}

const lines = [];
lines.push("Karaoke OS");

for (const raw of section[1].split("\n")) {
  const line = raw.trimEnd();
  if (!line) continue;

  // "**Venue staff — sign in required**" becomes a first-level branch.
  const group = line.match(/^\*\*(.+?)\*\*$/);
  if (group) {
    lines.push("\t" + clean(group[1]));
    continue;
  }

  const bullet = line.match(/^(\s*)\*\s+(.*)$/);
  if (!bullet) continue;

  // Two spaces per markdown level; +2 because everything sits under a group.
  const depth = Math.floor(bullet[1].length / 2) + 2;
  lines.push("\t".repeat(depth) + clean(bullet[2]));
}

/** Strip markdown so the outliner gets words, not syntax. */
function clean(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    // The map marks unbuilt items with a leading +. An outliner shows no
    // such marker, so say it in words instead.
    .replace(/^\+\s*(.*)$/, "$1  [todo]")
    .replace(/\s+/g, " ")
    .trim();
}

console.log(lines.join("\n"));
