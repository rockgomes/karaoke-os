#!/usr/bin/env node
// Builds docs/map.html from the screen list in docs/MAP.md.
//
// Generated, not hand-written, for the same reason the CI check exists: a
// picture of the app that drifts from the app is worse than no picture.
//
//   node scripts/build-map-page.mjs

import { readFile, writeFile } from "node:fs/promises";

const map = await readFile("docs/MAP.md", "utf8");
const section = map.match(/## 0\. Screens at a glance\n([\s\S]*?)\n---/);
if (!section) {
  console.error("docs/MAP.md has no '## 0. Screens at a glance' section.");
  process.exit(1);
}

const strip = (t) =>
  t
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

const tiers = [];
let screen = null;

for (const raw of section[1].split("\n")) {
  const line = raw.trimEnd();
  if (!line) continue;

  const group = line.match(/^\*\*(.+?)\*\*$/);
  if (group) {
    tiers.push({ name: strip(group[1]), screens: [] });
    screen = null;
    continue;
  }

  const bullet = line.match(/^(\s*)\*\s+(.*)$/);
  if (!bullet || !tiers.length) continue;

  const depth = Math.floor(bullet[1].length / 2);
  let text = bullet[2].trim();
  const todo = text.startsWith("+");
  if (todo) text = text.replace(/^\+\s*/, "");

  if (depth === 0) {
    // "**Manage a venue** `/admin/the-blue-note`"
    const named = text.match(/^\*\*(.+?)\*\*\s*`(.+?)`/);
    screen = {
      name: named ? strip(named[1]) : strip(text),
      route: named ? named[2] : "",
      todo,
      actions: [],
    };
    tiers.at(-1).screens.push(screen);
  } else if (screen) {
    const note = text.match(/^\*(.+)\*$/);
    screen.actions.push({
      text: strip(text),
      todo,
      aside: Boolean(note),
    });
  }
}

// How a person moves between screens. Keyed by the route shown on the card.
const EDGES = [
  ["/", "/login", "sign in"],
  ["/login", "/admin", "on success"],
  ["/admin", "/admin/new", ""],
  ["/admin", "/admin/the-blue-note", "your venue"],
  ["/admin/new", "/admin/the-blue-note", "after creating"],
  ["/admin/the-blue-note", "/v/the-blue-note", "view as guest"],
  ["/admin/the-blue-note/share", "/v/the-blue-note", "guests scan"],
];

const built = tiers.flatMap((t) => t.screens).filter((s) => !s.todo).length;
const total = tiers.flatMap((t) => t.screens).length;
const actions = tiers.flatMap((t) => t.screens).flatMap((s) => s.actions);
const actionsBuilt = actions.filter((a) => !a.todo && !a.aside).length;
const actionsTodo = actions.filter((a) => a.todo).length;

const esc = (s) =>
  String(s).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]);

const LANE_KEYS = ["guest", "staff", "platform"];

const lanesHtml = tiers
  .map((tier, i) => {
    const key = LANE_KEYS[i] ?? "guest";
    const cards = tier.screens
      .map(
        (s) => `
        <article class="card${s.todo ? " card--todo" : ""}" data-route="${esc(s.route)}">
          <header class="card__head">
            <h3 class="card__name">${esc(s.name)}</h3>
            ${s.todo ? '<span class="chip chip--todo">planned</span>' : ""}
          </header>
          ${s.route ? `<p class="card__route">${esc(s.route)}</p>` : ""}
          <ul class="card__actions">
            ${s.actions
              .map(
                (a) =>
                  `<li class="act${a.todo ? " act--todo" : ""}${a.aside ? " act--aside" : ""}">
                     <span class="act__text">${esc(a.text)}</span>
                     ${a.todo ? '<span class="chip chip--todo">planned</span>' : ""}
                   </li>`,
              )
              .join("")}
          </ul>
        </article>`,
      )
      .join("");

    return `
      <section class="lane lane--${key}" aria-labelledby="lane-${key}">
        <h2 class="lane__title" id="lane-${key}">
          <span class="lane__rail" aria-hidden="true"></span>
          ${esc(tier.name)}
        </h2>
        ${cards}
      </section>`;
  })
  .join("");

const html = `<title>Karaoke OS Screen Map</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=IBM+Plex+Mono:wght@400;500&family=Public+Sans:wght@400;500;600&display=swap">
<style>
  :root {
    --ground: #f3f4f1;
    --surface: #ffffff;
    --surface-2: #eceee9;
    --line: #d8dcd6;
    --ink: #13191f;
    --ink-2: #4d565f;
    --ink-3: #7c858d;
    --accent: #b1642a;
    --guest: #2c7a71;
    --staff: #b1642a;
    --platform: #5b5f8a;
    --radius: 10px;
    --shadow: 0 1px 2px rgb(19 25 31 / 0.06), 0 8px 24px -16px rgb(19 25 31 / 0.28);
    --font-display: "Bricolage Grotesque", "Trebuchet MS", sans-serif;
    --font-body: "Public Sans", -apple-system, BlinkMacSystemFont, sans-serif;
    --font-mono: "IBM Plex Mono", ui-monospace, "SFMono-Regular", monospace;
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --ground: #0f1317;
      --surface: #171c21;
      --surface-2: #1e242a;
      --line: #2a323a;
      --ink: #e7eaec;
      --ink-2: #a8b1b9;
      --ink-3: #78828b;
      --accent: #dd9455;
      --guest: #4fa79c;
      --staff: #dd9455;
      --platform: #8f94c4;
      --shadow: 0 1px 2px rgb(0 0 0 / 0.4), 0 8px 24px -16px rgb(0 0 0 / 0.8);
    }
  }

  :root[data-theme="dark"] {
    --ground: #0f1317;
    --surface: #171c21;
    --surface-2: #1e242a;
    --line: #2a323a;
    --ink: #e7eaec;
    --ink-2: #a8b1b9;
    --ink-3: #78828b;
    --accent: #dd9455;
    --guest: #4fa79c;
    --staff: #dd9455;
    --platform: #8f94c4;
    --shadow: 0 1px 2px rgb(0 0 0 / 0.4), 0 8px 24px -16px rgb(0 0 0 / 0.8);
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: var(--ground);
    color: var(--ink);
    font-family: var(--font-body);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  .wrap {
    max-width: 1180px;
    margin: 0 auto;
    padding: clamp(24px, 5vw, 56px) clamp(16px, 4vw, 32px) 72px;
  }

  .masthead { display: flex; flex-direction: column; gap: 18px; }

  .eyebrow {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-3);
    margin: 0;
  }

  h1 {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: clamp(30px, 5.2vw, 46px);
    line-height: 1.05;
    letter-spacing: -0.02em;
    text-wrap: balance;
    margin: 0;
  }

  .lede { margin: 0; max-width: 62ch; color: var(--ink-2); font-size: 16px; }

  .stats { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }

  .stat {
    display: flex;
    align-items: baseline;
    gap: 7px;
    padding: 7px 12px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 999px;
    font-size: 13px;
    color: var(--ink-2);
  }
  .stat b {
    font-family: var(--font-mono);
    font-weight: 500;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
    color: var(--ink);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px;
    margin: 28px 0 8px;
    padding-top: 20px;
    border-top: 1px solid var(--line);
  }

  .toggle {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    font-size: 14px;
    color: var(--ink-2);
    cursor: pointer;
    user-select: none;
  }
  .toggle input { position: absolute; opacity: 0; width: 0; height: 0; }
  .toggle__track {
    width: 38px; height: 22px; flex: none;
    background: var(--surface-2);
    border: 1px solid var(--line);
    border-radius: 999px;
    position: relative;
    transition: background 160ms ease, border-color 160ms ease;
  }
  .toggle__track::after {
    content: "";
    position: absolute; inset: 2px auto 2px 2px;
    width: 16px;
    border-radius: 50%;
    background: var(--ink-3);
    transition: transform 160ms ease, background 160ms ease;
  }
  .toggle input:checked + .toggle__track { background: color-mix(in srgb, var(--accent) 22%, var(--surface-2)); border-color: var(--accent); }
  .toggle input:checked + .toggle__track::after { transform: translateX(16px); background: var(--accent); }
  .toggle input:focus-visible + .toggle__track { outline: 2px solid var(--accent); outline-offset: 2px; }

  .legend { display: flex; flex-wrap: wrap; gap: 14px; margin-left: auto; font-size: 12.5px; color: var(--ink-3); }
  .legend span { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { width: 10px; height: 10px; border-radius: 3px; flex: none; }

  .board { position: relative; margin-top: 26px; }

  .connectors {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: visible;
    z-index: 0;
  }
  .connectors path {
    fill: none;
    stroke: var(--ink-3);
    stroke-width: 1.5;
    opacity: 0.5;
    stroke-dasharray: var(--len) ;
    stroke-dashoffset: 0;
  }
  .connectors text {
    font-family: var(--font-mono);
    font-size: 10px;
    fill: var(--ink-3);
  }
  .connectors .cap { fill: var(--ink-3); opacity: 0.55; }

  @media (prefers-reduced-motion: no-preference) {
    .connectors path { animation: draw 700ms ease-out both; }
    @keyframes draw { from { stroke-dashoffset: var(--len); } to { stroke-dashoffset: 0; } }
  }

  .lanes {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: clamp(14px, 2.2vw, 26px);
    align-items: start;
  }

  .lane { display: flex; flex-direction: column; gap: 14px; min-width: 0; }

  .lane__title {
    display: flex; align-items: center; gap: 9px;
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.01em;
    margin: 0 0 2px;
    color: var(--ink-2);
  }
  .lane__rail { width: 3px; height: 17px; border-radius: 2px; background: var(--lane); flex: none; }
  .lane--guest { --lane: var(--guest); }
  .lane--staff { --lane: var(--staff); }
  .lane--platform { --lane: var(--platform); }

  .card {
    background: var(--surface);
    border: 1px solid var(--line);
    border-left: 3px solid var(--lane);
    border-radius: var(--radius);
    padding: 15px 16px 13px;
    box-shadow: var(--shadow);
    min-width: 0;
  }
  .card--todo { background: transparent; border-style: dashed; box-shadow: none; }

  .card__head { display: flex; align-items: flex-start; gap: 8px; }
  .card__name {
    font-family: var(--font-display);
    font-size: 16.5px;
    font-weight: 700;
    letter-spacing: -0.01em;
    margin: 0;
    text-wrap: balance;
  }
  .card--todo .card__name { color: var(--ink-2); }

  .card__route {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--lane);
    margin: 3px 0 0;
    overflow-wrap: anywhere;
  }

  .card__actions { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; gap: 1px; }

  .act {
    display: flex; align-items: baseline; gap: 8px;
    font-size: 13.5px;
    color: var(--ink-2);
    padding: 4px 0 4px 15px;
    position: relative;
    border-top: 1px solid color-mix(in srgb, var(--line) 55%, transparent);
  }
  .act:first-child { border-top: 0; }
  .act::before {
    content: "";
    position: absolute; left: 3px; top: 11px;
    width: 4px; height: 4px; border-radius: 50%;
    background: var(--lane);
    opacity: 0.65;
  }
  .act--todo { color: var(--ink-3); }
  .act--todo::before { background: none; border: 1px solid var(--ink-3); width: 5px; height: 5px; top: 10px; opacity: 0.7; }
  .act--aside { font-style: italic; color: var(--ink-3); }
  .act--aside::before { display: none; }
  .act__text { min-width: 0; }

  .chip {
    font-family: var(--font-mono);
    font-size: 9.5px;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 4px;
    white-space: nowrap;
    flex: none;
    margin-left: auto;
  }
  .chip--todo { color: var(--ink-3); background: var(--surface-2); border: 1px solid var(--line); }

  body.hide-todo .act--todo,
  body.hide-todo .card--todo { display: none; }

  .foot {
    margin-top: 40px;
    padding-top: 18px;
    border-top: 1px solid var(--line);
    font-size: 12.5px;
    color: var(--ink-3);
    max-width: 68ch;
  }
  .foot code { font-family: var(--font-mono); font-size: 12px; color: var(--ink-2); }

  @media (max-width: 860px) {
    .lanes { grid-template-columns: 1fr; }
    .connectors { display: none; }
    .legend { margin-left: 0; }
  }
</style>

<div class="wrap">
  <header class="masthead">
    <p class="eyebrow">Karaoke OS · structure</p>
    <h1>Every screen, and how you get to it</h1>
    <p class="lede">
      Three audiences, three lanes. A guest never signs in. Venue staff sign in and
      manage one bar. The platform tier sees them all, and does not exist yet.
    </p>
    <div class="stats">
      <span class="stat"><b>${built}</b> screens built</span>
      <span class="stat"><b>${total - built}</b> planned</span>
      <span class="stat"><b>${actionsBuilt}</b> actions working</span>
      <span class="stat"><b>${actionsTodo}</b> actions to come</span>
    </div>
  </header>

  <div class="controls">
    <label class="toggle">
      <input type="checkbox" id="hide-todo">
      <span class="toggle__track" aria-hidden="true"></span>
      <span>Show only what is built</span>
    </label>
    <div class="legend">
      <span><i class="swatch" style="background: var(--guest)"></i> Guest</span>
      <span><i class="swatch" style="background: var(--staff)"></i> Venue staff</span>
      <span><i class="swatch" style="background: var(--platform)"></i> Platform</span>
    </div>
  </div>

  <div class="board">
    <svg class="connectors" aria-hidden="true"></svg>
    <div class="lanes">${lanesHtml}</div>
  </div>

  <p class="foot">
    Generated from <code>docs/MAP.md</code> by <code>scripts/build-map-page.mjs</code>.
    The route list in that file is checked against the real pages on every pull
    request, so this picture cannot quietly drift from the app.
  </p>
</div>

<script>
  const EDGES = ${JSON.stringify(EDGES)};

  const svg = document.querySelector(".connectors");
  const board = document.querySelector(".board");
  const NS = "http://www.w3.org/2000/svg";

  function draw() {
    svg.replaceChildren();
    if (window.matchMedia("(max-width: 860px)").matches) return;

    const origin = board.getBoundingClientRect();
    svg.setAttribute("viewBox", \`0 0 \${origin.width} \${origin.height}\`);

    for (const [from, to, label] of EDGES) {
      const a = board.querySelector(\`[data-route="\${from}"]\`);
      const b = board.querySelector(\`[data-route="\${to}"]\`);
      if (!a || !b || a.offsetParent === null || b.offsetParent === null) continue;

      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();

      // Cross-lane edges curve directly. Same-lane edges are bracketed out
      // past the lane's edge, because a straight drop would run underneath
      // whatever card sits between the two.
      const sameLane = Math.abs(ra.left - rb.left) < 4;

      const path = document.createElementNS(NS, "path");
      let d, labelX, labelY;

      if (sameLane) {
        const gutter = ra.left - origin.left - 13;
        const y1 = ra.top + ra.height / 2 - origin.top;
        const y2 = rb.top + rb.height / 2 - origin.top;
        const x = ra.left - origin.left;
        d =
          \`M \${x} \${y1} C \${gutter} \${y1}, \${gutter} \${y1}, \${gutter} \${y1 + 8}\` +
          \` L \${gutter} \${y2 - 8} C \${gutter} \${y2}, \${gutter} \${y2}, \${x} \${y2}\`;
        labelX = gutter;
        labelY = (y1 + y2) / 2;
        var endX = x, endY = y2;
      } else {
        const leftToRight = rb.left >= ra.right - 1;
        const x1 = (leftToRight ? ra.right : ra.left) - origin.left;
        const x2 = (leftToRight ? rb.left : rb.right) - origin.left;
        const y1 = ra.top + ra.height / 2 - origin.top;
        const y2 = rb.top + rb.height / 2 - origin.top;
        const mid = (x1 + x2) / 2;
        d = \`M \${x1} \${y1} C \${mid} \${y1}, \${mid} \${y2}, \${x2} \${y2}\`;
        labelX = mid;
        labelY = (y1 + y2) / 2 - 6;
        var endX = x2, endY = y2;
      }

      path.setAttribute("d", d);
      svg.appendChild(path);
      path.style.setProperty("--len", path.getTotalLength());

      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("class", "cap");
      dot.setAttribute("cx", endX);
      dot.setAttribute("cy", endY);
      dot.setAttribute("r", "3");
      svg.appendChild(dot);

      if (label) {
        const text = document.createElementNS(NS, "text");
        text.setAttribute("x", labelX);
        text.setAttribute("y", labelY);
        text.setAttribute("text-anchor", "middle");
        // Cross-lane labels sit in the gap between lanes; same-lane labels sit
        // in the gutter, so turn them upright to stay clear of the cards.
        if (sameLane) text.setAttribute("transform", \`rotate(-90 \${labelX} \${labelY})\`);
        text.textContent = label;
        svg.appendChild(text);
      }
    }
  }

  const toggle = document.getElementById("hide-todo");
  toggle.addEventListener("change", () => {
    document.body.classList.toggle("hide-todo", toggle.checked);
    requestAnimationFrame(draw);
  });

  addEventListener("resize", () => requestAnimationFrame(draw));
  if (document.fonts?.ready) document.fonts.ready.then(draw);
  requestAnimationFrame(draw);
</script>
`;

await writeFile("docs/map.html", html);
console.log(`docs/map.html written — ${total} screens, ${actions.length} actions.`);
