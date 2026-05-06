# coming son. 😭😭😭😭

A community meme board for "son" memes — submit, vote, browse, and discuss.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- Required env: none (Supabase credentials are hardcoded in `public/config.js`)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Server: Express 5 (serves both `/api` routes and static site files)
- Static site: Vanilla HTML/CSS/JS + Supabase JS client (CDN)
- DB/Auth: Supabase (with localStorage fallback when unconfigured)

## Where things live

- `artifacts/api-server/public/` — the full static site (index.html, styles.css, script.js, backend.js, config.js, assets/, gallery/, forums/, admin/, signup/)
- `artifacts/api-server/src/app.ts` — Express app; serves `/api` routes then static files from `public/`
- `public/config.js` — Supabase URL + anon key
- `public/supabase-schema.sql` — run this in Supabase SQL editor to set up the `app_state` table

## Architecture decisions

- Static site is served by the same Express server as the API, from the `public/` folder
- Express 5 requires `/*splat` syntax for catch-all routes (not `*`)
- The site works fully offline with localStorage when Supabase isn't configured
- Admin access is gated to `un1quebmgo@gmail.com` — verified via Supabase Auth when configured
- GitHub push requires a personal access token or GitHub integration (not yet set up)

## Product

- Home feed: submit memes, upvote, browse with filtering
- Gallery: searchable/sortable archive of all approved uploads
- Forums: threaded discussions with topic filters and hot/new/top sorting
- Profiles: top uploaders ranked by votes
- Admin queue: accept/reject pending submissions (admin-only)
- Sign up: Supabase email/password auth with localStorage fallback

## User preferences

- Site source lives at GitHub repo: `un1quebmgo-sys/son`
- GitHub push not yet configured (no token provided)

## Gotchas

- Supabase anon key in `config.js` starts with `sb_publishable_` — verify it's correct in the Supabase dashboard if sync fails
- The `/*splat` catch-all in Express 5 must come AFTER `express.static()` or it will intercept asset requests

## Pointers

- See `public/BACKEND_SETUP.md` for Supabase setup instructions
- See the `pnpm-workspace` skill for workspace structure details
