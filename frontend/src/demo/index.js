// Demo mode.
//
// ON only when REACT_APP_DEMO is exactly "true". Anything else — unset,
// empty, "false" — means OFF, so the real app is untouched.
//
// When on, an axios adapter answers every /api/* call from memory instead
// of the Express backend. Nothing is persisted: edits survive until the
// page is reloaded, then the list resets. No backend, no database, no keys.
import axios from "axios";
import { DEMO_USER, DEMO_LIBRARY, DEMO_SONGS } from "./songs";

export const IS_DEMO = process.env.REACT_APP_DEMO === "true";

const LATENCY_MS = 120; // enough that loading states are visible, not annoying

function ok(data, status = 200) {
  return { data, status, statusText: "OK", headers: {}, config: {} };
}

function fail(status, error) {
  const err = new Error(error);
  err.response = { data: { error }, status };
  return Promise.reject(err);
}

function createState() {
  return {
    libraries: [{ ...DEMO_LIBRARY }],
    songs: DEMO_SONGS.map((s) => ({ ...s })),
    nextSongId: DEMO_SONGS.length + 1,
    nextLibraryId: 2,
  };
}

function uniqueSorted(songs, key) {
  return [...new Set(songs.map((s) => s[key]).filter(Boolean))].sort();
}

function route(state, method, path, body) {
  const seg = path.replace(/^\/api\//, "").split("/");

  // ── auth ──────────────────────────────────────────────────
  if (seg[0] === "auth") {
    if (seg[1] === "me") return ok(DEMO_USER);
    if (seg[1] === "login" || seg[1] === "register")
      return ok({ token: "demo-token", user: DEMO_USER });
  }

  // ── public read-only views ────────────────────────────────
  if (seg[0] === "public" && seg[1] === "libraries") {
    if (!seg[3]) return ok(state.libraries[0]);
    if (seg[3] === "songs") return ok(state.songs);
    if (seg[3] === "genres") return ok(uniqueSorted(state.songs, "genre"));
    if (seg[3] === "artists") return ok(uniqueSorted(state.songs, "artist"));
  }

  // ── libraries ─────────────────────────────────────────────
  if (seg[0] === "libraries") {
    if (!seg[1]) {
      if (method === "get") return ok(state.libraries);
      if (method === "post") {
        const lib = {
          id: state.nextLibraryId++,
          user_id: DEMO_USER.id,
          name: body?.name ?? "Untitled",
          slug: (body?.name ?? "untitled").toLowerCase().replace(/\s+/g, "-"),
          created_at: new Date().toISOString(),
        };
        state.libraries.push(lib);
        return ok(lib, 201);
      }
    }

    // /libraries/:id
    if (seg[1] && !seg[2]) {
      const id = Number(seg[1]);
      if (method === "put") {
        const lib = state.libraries.find((l) => l.id === id);
        if (lib) Object.assign(lib, body ?? {});
        return ok(lib ?? {});
      }
      if (method === "delete") {
        state.libraries = state.libraries.filter((l) => l.id !== id);
        return ok({ success: true });
      }
    }

    // /libraries/:id/<thing>
    if (seg[2] === "genres") return ok(uniqueSorted(state.songs, "genre"));
    if (seg[2] === "artists") return ok(uniqueSorted(state.songs, "artist"));

    if (seg[2] === "songs") {
      // /libraries/:id/songs
      if (!seg[3]) {
        if (method === "get") return ok(state.songs);
        if (method === "post") {
          const song = {
            id: state.nextSongId++,
            library_id: Number(seg[1]),
            created_at: new Date().toISOString(),
            genre: null,
            duration: null,
            year: null,
            album: null,
            ...body,
          };
          state.songs.unshift(song);
          return ok(song, 201);
        }
      }

      if (seg[3] === "batch-import" && method === "post") {
        const incoming = body?.songs ?? [];
        const added = incoming.map((s) => ({
          id: state.nextSongId++,
          library_id: Number(seg[1]),
          created_at: new Date().toISOString(),
          ...s,
        }));
        state.songs.unshift(...added);
        return ok({ imported: added.length, songs: added });
      }

      // delete every song by one artist
      if (seg[3] === "artist" && method === "delete") {
        const artist = decodeURIComponent(seg[4] ?? "");
        state.songs = state.songs.filter((s) => s.artist !== artist);
        return ok({ success: true });
      }

      // /libraries/:id/songs/:songId
      const songId = Number(seg[3]);
      if (method === "put") {
        const song = state.songs.find((s) => s.id === songId);
        if (song) Object.assign(song, body ?? {});
        return ok(song ?? {});
      }
      if (method === "delete") {
        state.songs = state.songs.filter((s) => s.id !== songId);
        return ok({ success: true });
      }
    }
  }

  return fail(404, `No demo route for ${method.toUpperCase()} ${path}`);
}

export function installDemoApi() {
  if (!IS_DEMO) return;

  const state = createState();

  // Land signed in, so nobody meets a login wall on a demo.
  if (!localStorage.getItem("token")) {
    localStorage.setItem("token", "demo-token");
  }

  axios.defaults.adapter = (config) => {
    const method = (config.method ?? "get").toLowerCase();
    const path = (config.url ?? "").split("?")[0];

    let body = config.data;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = undefined;
      }
    }

    if (!path.startsWith("/api/")) {
      return fail(404, `Demo mode blocked a non-API request to ${path}`);
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          Promise.resolve(route(state, method, path, body)).then(resolve, reject);
        } catch (e) {
          reject(e);
        }
      }, LATENCY_MS);
    });
  };
}
