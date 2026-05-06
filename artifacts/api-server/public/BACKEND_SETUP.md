# Backend setup

This site is wired for Supabase, with localStorage fallback for development.

## 1. Create Supabase project

Create a project at Supabase, then copy:

- Project URL
- Public anon key

Paste them into `config.js`:

```js
window.SON_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_PUBLIC_ANON_KEY"
};
```

## 2. Create database table

Open the Supabase SQL editor and run `supabase-schema.sql`.

The site stores shared app data in the `app_state` table and uses Supabase Auth for email/password sign up when configured.

## 3. Deploy

Upload these static files to GitHub Pages, Netlify, Vercel static hosting, or any normal web host.

Important files:

- `index.html`
- `gallery.html`
- `forums.html`
- `admin.html`
- `signup.html`
- `styles.css`
- `script.js`
- `config.js`
- `backend.js`
- `supabase-schema.sql`
- `assets/`

## GitHub push note

This environment currently has no `git`, no `gh`, and no GitHub token, so it cannot push directly to `un1quebmgo-sys/son` without GitHub auth/tooling being installed.
