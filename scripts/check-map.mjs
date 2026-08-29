#!/usr/bin/env node
// Fails if the routes on disk and the routes in docs/MAP.md disagree.
//
// The map is only worth having if it is true. This is what stops it rotting:
// add a page without listing it, or list one you deleted, and CI goes red.

import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const APP_DIR = "web/src/app";
const MAP_FILE = "docs/MAP.md";

async function findPages(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await findPages(full)));
    } else if (/^page\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      found.push(full);
    }
  }
  return found;
}

function toRoute(pagePath) {
  const segments = relative(APP_DIR, pagePath)
    .split("/")
    .slice(0, -1)
    // (group) folders organise files without appearing in the URL.
    .filter((s) => !(s.startsWith("(") && s.endsWith(")")));
  return "/" + segments.join("/");
}

function routesFromMap(markdown) {
  const block = markdown.match(/```routes\n([\s\S]*?)```/);
  if (!block) {
    throw new Error(`${MAP_FILE} has no \`\`\`routes block.`);
  }
  return block[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

const onDisk = (await findPages(APP_DIR)).map(toRoute).sort();
const inMap = routesFromMap(await readFile(MAP_FILE, "utf8")).sort();

const missing = onDisk.filter((r) => !inMap.includes(r));
const stale = inMap.filter((r) => !onDisk.includes(r));

if (missing.length || stale.length) {
  console.error(`${MAP_FILE} does not match the routes in ${APP_DIR}.\n`);
  for (const route of missing) {
    console.error(`  missing from the map:  ${route}`);
  }
  for (const route of stale) {
    console.error(`  on the map, not built: ${route}`);
  }
  console.error(`\nUpdate the \`\`\`routes block in ${MAP_FILE}.`);
  process.exit(1);
}

console.log(`${MAP_FILE} matches all ${onDisk.length} routes.`);
