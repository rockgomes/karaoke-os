# Deployment

Live: **https://karaoke-os.netlify.app**

Host: Netlify project `karaoke-os`, team Rock.
Database: Supabase project `karaoke-os` (`tczjrhcnufvehcthsens`, eu-west-1).

## How it is wired

`netlify.toml` sits at the repo root. It points Netlify at `web/`, the only
directory that is still live code.

| Setting | Value | Why |
|---|---|---|
| `base` | `web` | Everything above it is the superseded prototype. |
| `publish` | `web/.next` | Publish is relative to the repo root, **not** to `base`. Set it to `.next` and the build fails with "publish directory was not found". |
| plugin | `@netlify/plugin-nextjs` | Runs the App Router, the server actions, and `src/proxy.ts`. Without it Netlify would publish static files only. |
| `NODE_VERSION` | `22` | Matches CI. |

Next 16.3.3 works on plugin 5.15.13. The build produces one server function
(`___netlify-server-handler`) and one edge function for the proxy.

## Environment variables

Set on the Netlify project, not in the repo:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The first two are publishable. Row Level Security, not key secrecy, is what
keeps one venue out of another venue's data.

To change them:

```bash
netlify env:set NAME value
```

A change needs a redeploy to take effect.

## Deploying by hand

```bash
netlify deploy          # draft URL, safe to check first
netlify deploy --prod   # publish to karaoke-os.netlify.app
```

`netlify build` runs the same build locally without deploying.

## Still to do

- **Continuous deploy.** The Netlify project is not linked to GitHub yet, so
  `main` does not deploy itself. Link it at
  https://app.netlify.com/projects/karaoke-os/configuration/deploys — that also
  gives every pull request its own preview URL.
- **Supabase auth URLs.** Site URL and redirect URLs still point at
  `http://localhost:3000`. Confirmation and password reset links will send
  people to their own machine until `https://karaoke-os.netlify.app` is added
  under Authentication → URL Configuration.
