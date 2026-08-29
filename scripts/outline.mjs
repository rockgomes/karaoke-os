#!/usr/bin/env node
// Exports the screen list from docs/MAP.md in the shapes outliners accept.
//
//   node scripts/outline.mjs            tab-indented text, for pasting
//   node scripts/outline.mjs --md       Markdown for Xmind's File > Import
//   node scripts/outline.mjs --opml     OPML, the most reliable import
//
// Why three. Pasting into an outliner needs TAB characters, because that is
// what builds the levels — markdown bullets arrive as one flat row. Xmind's
// Markdown import, by contrast, takes its levels from headings and indented
// bullets, and ignores bold text, so a file of bullets alone also flattens.
// OPML states the nesting outright and cannot be misread.

import { readFile } from "node:fs/promises";

const format = process.argv[2] ?? "--tabs";

const map = await readFile("docs/MAP.md", "utf8");
const section = map.match(/## 0\. Screens at a glance\n([\s\S]*?)\n---/);
if (!section) {
  console.error("docs/MAP.md has no '## 0. Screens at a glance' section.");
  process.exit(1);
}

/** { text, depth } — depth 0 is a group, 1 a screen, 2+ an action. */
const nodes = [];

for (const raw of section[1].split("\n")) {
  const line = raw.trimEnd();
  if (!line) continue;

  const group = line.match(/^\*\*(.+?)\*\*$/);
  if (group) {
    nodes.push({ text: clean(group[1]), depth: 0 });
    continue;
  }

  const bullet = line.match(/^(\s*)\*\s+(.*)$/);
  if (!bullet) continue;

  nodes.push({
    text: clean(bullet[2]),
    depth: Math.floor(bullet[1].length / 2) + 1,
  });
}

function clean(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    // The map marks unbuilt items with a leading +. An outliner shows no such
    // marker, so say it in words.
    .replace(/^\+\s*(.*)$/, "$1 [todo]")
    .replace(/\s+/g, " ")
    .trim();
}

const escapeXml = (s) =>
  s.replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c],
  );

if (format === "--md") {
  // Xmind takes the first line as the central topic, reads levels from
  // headings, then from bullet indentation. Bold text carries no level.
  const out = ["# Karaoke OS", ""];
  for (const node of nodes) {
    if (node.depth === 0) out.push("", `## ${node.text}`);
    else out.push(`${"  ".repeat(node.depth - 1)}- ${node.text}`);
  }
  console.log(out.join("\n"));
} else if (format === "--opml") {
  const out = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<opml version="2.0">',
    "  <head><title>Karaoke OS</title></head>",
    "  <body>",
  ];
  let open = 0;
  for (const node of nodes) {
    while (open > node.depth) {
      out.push(`${"  ".repeat(open + 1)}</outline>`);
      open--;
    }
    out.push(`${"  ".repeat(node.depth + 2)}<outline text="${escapeXml(node.text)}">`);
    open = node.depth + 1;
  }
  while (open > 0) {
    out.push(`${"  ".repeat(open + 1)}</outline>`);
    open--;
  }
  out.push("  </body>", "</opml>");
  console.log(out.join("\n"));
} else {
  const out = ["Karaoke OS"];
  for (const node of nodes) {
    out.push("\t".repeat(node.depth + 1) + node.text);
  }
  console.log(out.join("\n"));
}
