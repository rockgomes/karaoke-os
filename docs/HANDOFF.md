# Karaoke OS — handoff

Written 2026-08-28. The purpose of this file is to save the next person
(or the next AI session) the hour it takes to rediscover the things that
are not obvious from the code.

## What this is

A song library manager for karaoke nights. You keep a private library,
add songs, and the app fills in genre, year, album, duration and cover
art by looking each track up against external music APIs.

- **Frontend** — `frontend/`, React (Create React App via CRACO), HeroUI,
  axios, react-router.
- **Backend** — `backend/server.js`, Express + SQLite, JWT auth. One
  library per user, plus read-only public library pages by slug.
- **Repo** — https://github.com/rockgomes/karaoke-os
- **Public demo** — https://rockgomes-karaoke-demo.netlify.app

`~/Dev/karaoke-app` is an **older, superseded prototype** — a 2025
TypeScript sketch of the same idea. Do not develop against it. The only
thing it has that this does not is a Genius API call used for lyrics
language detection, which was never ported.

## Two traps that make the project look broken

Both of these were hit and fixed on 2026-08-28. If the build fails,
suspect these first.

### 1. `npm install` fails on `@heroui/theme`

`@heroui/react` is on the 2.8.x line but `@heroui/theme` tops out at
**2.4.26**. Pinning theme to `^2.8.x` makes every install fail with
`notarget`. When install fails, `@craco/craco` never lands in
`node_modules`, which causes trap 2.

### 2. Never run `react-scripts` directly

CRA 5.0.1 hardcodes `tailwindcss` as a PostCSS plugin whenever it sees a
`tailwind.config.js` (`react-scripts/config/webpack.config.js`). Tailwind
v4 rejects that — it needs `@tailwindcss/postcss`.

`craco.config.js` already fixes this with `style.postcss.mode: "file"`,
which routes the build through this project's own `postcss.config.js`.
That fix only applies through the `craco` scripts.

```bash
npm run build     # correct — goes through CRACO
npx react-scripts build   # wrong — bypasses CRACO, fails on Tailwind
```

On Netlify, `CI=false` is required. The components carry pre-existing
lint warnings and Netlify sets `CI=true`, which promotes warnings to
build failures. It is set in `frontend/netlify.toml`.

## Demo mode

Enabled by `REACT_APP_DEMO=true`. Everything lives in `frontend/src/demo/`
and is installed from `index.js` before the app renders.

The design choice worth knowing: **it replaces the transport, not the
app.** An axios adapter answers every `/api/*` route from an in-memory
store, so no screen, form or component is modified or aware of it.
Requests still go out and still come back.

The alternative — faking data inside each component — would have meant
editing every screen and leaving demo branches scattered through the real
app. This way the real app never loads the file at all.

- Edits behave normally and reset on page reload.
- A demo token is seeded into `localStorage` so nobody meets a login wall.
- Ships **light mode only** while the dark theme is unfinished. Hiding the
  toggle is not enough on its own: `ThemeProvider` falls back to the
  visitor's OS colour scheme, so the initial theme is forced too.

What it does not do is prove the backend works. It is an honest demo of
the interface and nothing else.

## Album art

Cover art comes from the **iTunes Search API** (`fetchCoverArt` in
`backend/server.js`). No API key, no rate limit worth handling.

Cover Art Archive was tried first and rejected. It is keyed by MusicBrainz
release ID, which sounds ideal, but it is served from archive.org and the
MusicBrainz lookups timed out repeatedly:

| Source | Resolved |
|---|---|
| Cover Art Archive | 3 / 24 |
| iTunes Search | 24 / 24 |

Last.fm's `album.getInfo` returns an image array and is the fallback.
That call already existed — it was fetching album info and discarding the
images.

Storage: `songs.cover_url` and `songs.musicbrainz_id`, added with an
idempotent `ALTER TABLE` because SQLite has no `ADD COLUMN IF NOT EXISTS`.
`needsLookup` counts a missing cover, so songs enriched before album art
existed still get artwork rather than being skipped for having every
other field filled.

Rendering: `SongsTable` and `MobileSongCard` both hide the image on error,
falling back to the empty cover slot. Not every track resolves, and a
broken-image icon is worse than a plain square.

## Metadata lookup, in general

Roughly 876 lines across two service classes in `backend/server.js`:

- `MusicBrainzService` — primary. Free, no key, but rate-limited to one
  request per second, so lookups queue rather than fire in parallel.
- `MusicMetadataService` — Last.fm fallback across three endpoints
  (track / album / artist), genre extraction with a tag-quality filter,
  genre combination and normalisation, caching.

`LASTFM_API_KEY` is read from the environment. MusicBrainz needs nothing.

## Open work

- **Genius language detection** — exists in the superseded `karaoke-app`,
  never ported here.
- **Dark mode** — unfinished, which is why the demo forces light.
- **Deployment** — only the frontend is deployed, as the demo. Express and
  SQLite cannot run on static hosting; a real deployment needs the backend
  moved to serverless functions and the database hosted.
