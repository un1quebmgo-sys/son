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

## 3. Google login

In Google Cloud OAuth client settings, add this authorized redirect URI:

```text
https://qymlnrpdwmfwtqstqnci.supabase.co/auth/v1/callback
```

Add these authorized JavaScript origins:

```text
https://son.ceo
https://www.son.ceo
```

In Supabase, go to Authentication -> Providers -> Google and paste:

- Client ID: `630582187347-oidf2d3oflac6gdmkrllar3knd359lg3.apps.googleusercontent.com`
- Client secret: use the secret from the Google JSON file, but do not commit it to the repo.

In Supabase Authentication -> URL Configuration, use:

```text
Site URL: https://son.ceo
Redirect URLs:
https://son.ceo/signup/
https://www.son.ceo/signup/
http://localhost:4179/signup/
```

## 4. Deploy

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
