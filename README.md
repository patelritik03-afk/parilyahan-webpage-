# Parilyahan Sa Kalye — Website & Reservation System

> **Putting the site live?** Start with [GO-LIVE.md](GO-LIVE.md) — a plain-language, step-by-step
> guide. In Claude Code, type: *"Read GO-LIVE.md and help me go live, one step at a time."*

Next.js site for Parilyahan Sa Kalye: home, about, daily buffet menu, gallery, online
reservations, and a password-protected admin panel to manage the daily menu, view
reservations, and manage gallery photos.

## Stack

- Next.js (App Router, TypeScript) + Tailwind CSS
- Supabase (Postgres + Storage) — data and photo storage
- Resend — reservation/confirmation emails
- CallMeBot — free WhatsApp notification to the owner's own number
- Single-owner admin login (bcrypt password + signed session cookie)

## One-time setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Go to SQL Editor and run [`supabase/schema.sql`](supabase/schema.sql) — creates the
   `daily_menu`, `reservations`, `gallery_images` tables and the public `site-images`
   storage bucket.
3. From Project Settings > API, copy the **Project URL** and the **service_role** key
   (not the anon key — the app only uses the service role key, server-side only).

### 2. Resend (emails)

1. Sign up at [resend.com](https://resend.com), verify a sending domain (or use their
   test domain while developing).
2. Create an API key.

### 3. CallMeBot (WhatsApp notification to the owner)

1. Save `+34 644 59 71 67` (CallMeBot's number) to your phone contacts.
2. WhatsApp it: `I allow callmebot to send me messages`.
3. You'll receive your personal API key in reply. See
   [callmebot.com/blog/free-api-whatsapp-messages](https://www.callmebot.com/blog/free-api-whatsapp-messages/)
   if you don't get a reply.

### 3b. Where reservations and enquiries go

Both are stored in Supabase and shown in the admin panel (Reservations and Enquiries tabs). Each one also
triggers an email and a WhatsApp alert to the owner (see the Resend and CallMeBot steps).

### 3c. Google reviews on the home page

The home page shows 5-star reviews one by one, with a "Write a review on Google" button. Two sources
are combined (duplicates removed):

- **Automatic from Google** (optional): in [Google Cloud Console](https://console.cloud.google.com) create a
  project, enable **Places API (New)**, and create an **API key** (billing must be switched on, but one
  request every few hours costs almost nothing). Set `GOOGLE_PLACES_API_KEY`. The site finds the
  restaurant by name and address; set `GOOGLE_PLACE_ID` only if it picks the wrong listing. Google only
  shares its handful of most relevant reviews per request, and only the 5-star ones are shown.
- **By hand**: Admin > Reviews > "Add a 5-star review by hand" (copy genuine reviews from your Google
  Business Profile). You can hide or delete them at any time.

With no key and no manual reviews, the section shows an invitation to be the first to review. Run the new
`reviews` table from `supabase/schema.sql` in Supabase. The review button uses your Google listing link
(`NEXT_PUBLIC_GOOGLE_REVIEW_URL`); once the Place ID is known it switches to Google's direct "write a
review" page automatically.

### 4. Admin password

Generate a bcrypt hash for your chosen admin password:

```bash
node scripts/hash-password.mjs "your-password"
```

### 5. Environment variables

Copy `.env.local.example` to `.env.local` and fill in the values from steps 1-4, plus
your social links and WhatsApp number.

**Important:** the `ADMIN_PASSWORD_HASH` value contains `$` characters (bcrypt format).
Next.js expands `$` in `.env` files, so every `$` in the hash must be escaped as `\$`
or the password check will silently fail. `.env.local.example` shows the correct format.
This applies to `.env` **files only** - in the Vercel dashboard, paste the hash exactly as
generated, with plain `$` signs and no backslashes.

`ADMIN_SESSION_SECRET` must be at least 32 characters of real randomness; the app refuses
to sign in with anything shorter. Generate one with
`node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`.

### 6. Abuse protection

The reservation form, enquiry form and admin login are rate-limited per IP address
(5 submissions / 10 minutes for the forms, 10 attempts / 15 minutes for login), and both
public forms carry a hidden honeypot field that silently discards bot submissions.

Out of the box the limits are counted in memory, per server instance. For a reliable
shared counter in production, create a free Redis database at [upstash.com](https://upstash.com),
and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`; the app picks them up
automatically.

## Local development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`. Admin panel is at `/admin`.

Before pushing: `npm run lint`, `npm run typecheck` and `npm run build` should all pass.

## Deployment

Deploy to [Vercel](https://vercel.com): import this repo, add the same environment
variables from `.env.local` in the Vercel project settings (see the `$` note above), and
deploy. Point your purchased domain's DNS at the Vercel project once it's live, then set
`NEXT_PUBLIC_SITE_URL` to the final address so the sitemap, `robots.txt` and link previews
use it.

Gallery photos are re-encoded to WebP (max 1600 px) on upload; only JPG, PNG and WebP up
to 4 MB are accepted. Search engines are told not to index `/admin` or `/api`.

## Notes for future changes

- The daily menu is one row per date in `daily_menu` — the admin panel always edits
  today's row.
- Reservations currently auto-confirm with no capacity limits (`status` and `time`
  columns already exist on `reservations` for when slot/capacity rules are added later).
- About Us copy and social links are static — edit `src/app/about/page.tsx` and the
  `NEXT_PUBLIC_*` env vars respectively.
