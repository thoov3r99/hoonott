# HooNott Portal

Private family portal at **hoonott.com**. Shared calendar with admin-approved signups for the Hoover-Nott family.

- **Hosting**: Vercel
- **Framework**: Next.js 16 (App Router)
- **DB**: Neon Postgres via Vercel Marketplace, Drizzle ORM
- **Auth**: Auth.js v5 (Google OAuth + email/password, JWT sessions)
- **Email**: Resend
- **Calendar**: FullCalendar (month + week on desktop, agenda list on mobile)
- **Time zone**: America/New_York (hardcoded)
- **Admin**: `thoover231@gmail.com` (hardcoded, non-transferable)

---

## Local development

1. Install deps:
   ```sh
   npm install
   ```
2. Copy `.env.example` → `.env.local` and fill in values (after the first Vercel deploy you can pull with `npx vercel env pull .env.local`).
3. First-time DB setup against your Neon URL:
   ```sh
   npm run db:push
   ```
4. Start dev server:
   ```sh
   npm run dev
   ```

## Available scripts
- `npm run dev` — Next dev server
- `npm run build` — production build
- `npm run start` — run the built app
- `npm run typecheck` — TypeScript check
- `npm run lint` — ESLint
- `npm run db:generate` — generate a new Drizzle migration from schema changes
- `npm run db:push` — push schema directly (fast for dev; bypasses migrations)
- `npm run db:migrate` — apply migrations in `./drizzle`
- `npm run db:studio` — open Drizzle Studio against `DATABASE_URL`

---

## Deploying for the first time

External accounts to create:
1. **GitHub** — push this repo.
2. **Vercel** — import the repo as a new project.
3. **Neon Postgres** — from the Vercel project's **Storage** tab → Marketplace → add Neon. `DATABASE_URL` is auto-injected.
4. **Google Cloud Console** — create OAuth 2.0 Client ID (Web):
   - APIs & Services → OAuth consent screen → External; add `thoover231@gmail.com` as a test user (or publish).
   - Credentials → Create OAuth Client ID → Web application.
   - Authorized redirect URIs:
     - `https://hoonott.com/api/auth/callback/google`
     - your specific Vercel preview URL(s) under `*.vercel.app`, e.g. `https://hoonott-git-main-yourname.vercel.app/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google`
   - Copy the Client ID + Client Secret.
5. **Resend** — sign up at resend.com:
   - Domains → Add `hoonott.com`.
   - At your DNS host (where `hoonott.com` is registered), add the SPF, DKIM, and DMARC TXT records Resend provides.
   - API Keys → Create API key.
   - Pick a "from" address like `noreply@hoonott.com`.
6. **Custom domain** — in the Vercel project:
   - Settings → Domains → Add `hoonott.com` and `www.hoonott.com`.
   - Update DNS at your registrar per Vercel's instructions (apex A or ALIAS record, plus CNAME for www).

Env vars to set in Vercel (Production, Preview, Development — all three):

| Name | Value |
|---|---|
| `DATABASE_URL` | (auto from Neon marketplace integration) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://hoonott.com` (production); leave blank or set preview-specific for previews |
| `AUTH_GOOGLE_ID` | From Google Cloud Console |
| `AUTH_GOOGLE_SECRET` | From Google Cloud Console |
| `RESEND_API_KEY` | From Resend |
| `EMAIL_FROM` | `HooNott Portal <noreply@hoonott.com>` |
| `ADMIN_EMAIL` | `thoover231@gmail.com` |

Then pull them locally with `npx vercel env pull .env.local`.

Apply the initial migration to your Neon DB (one-time):
```sh
DATABASE_URL="<your-neon-url>" npm run db:migrate
```

---

## Architecture notes

- Auth gating happens in `app/(app)/layout.tsx` (server-side check via `auth()`), which redirects unauthenticated, pending, or rejected users.
- The hardcoded admin (`thoover231@gmail.com`) is auto-approved + promoted on first sign-in by `auth.ts`'s `events.createUser` for Google, and by `app/api/signup/route.ts` for the credentials path.
- Calendar events are stored as `timestamptz` in UTC; all display formatting happens via `lib/tz.ts` in America/New_York. The DB never holds local-time strings.
- The user's color is auto-assigned from `lib/palette.ts` on approval; users can switch on `/profile` to any color no one else holds.
- `lib/permissions.ts` centralizes who can edit which event (author or admin).

## Useful URLs after deploy

- `/` — calendar (signed-in)
- `/login`, `/signup`, `/forgot-password`, `/reset-password`
- `/pending`, `/rejected` — gated-account redirects
- `/profile` — name, phone, calendar color
- `/admin` — admin-only: approve/reject/remove/demote
