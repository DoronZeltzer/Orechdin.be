# Orechdin website: running and deploying

A Next.js site (App Router) in three languages: Dutch (default, at `/`), English (`/en`) and French (`/fr`). It has no database and no user accounts. The only server code is the contact form endpoint, `/api/contact`, which emails the office.

## 1. Run it locally

```bash
npm install
cp .env.example .env.local     # then edit the values you need
npm run dev                    # http://localhost:3000
```

## 2. Settings (environment variables)

All of them are listed in `.env.example`.

| Variable | Needed | What it does |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | in production | The public address (`https://www.orechdin.be`). Used for the sitemap, canonical links and share previews. |
| `ORECHDIN_OUTBOX_HOST`, `_PORT`, `_USER`, `_PASSWORD`, `_FROM` | for the contact form | The office's outgoing mail account. |
| `ORECHDIN_CONTACT_TO` | optional | Where enquiries are delivered. Defaults to the `_FROM` address. |

If the mail settings are missing, the contact form still loads, but sending shows the visitor the office's phone number and email instead. Nothing is lost silently.

## 3. Build and start

```bash
npm run build
npm run start
```

Any host that runs Node 20 or newer works (Vercel, Cloudflare, a VPS). Set the variables above in the host's settings, never in the repository. `.env.local` is ignored by git on purpose.

## 4. Checks before going live

- Send one real message through the contact form and confirm it arrives and that replying goes to the visitor.
- Open `/privacy` and `/cookies` in all three languages.
- Confirm the Google Maps frame on `/office` appears only after the visitor allows it.
- The in-memory rate limit on the contact form is per server instance. On a host that runs several instances, put a real rate limiter in front of `/api/contact`.
