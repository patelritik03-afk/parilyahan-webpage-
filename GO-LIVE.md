# Going live — a guide for Ritik

*Written 19 September 2026 by Vishal, after a full security review of the website.*

Hi Ritik — the website is in good shape. I reviewed every part of it, fixed the things that
needed fixing, and pushed those fixes to the project. This page tells you, in plain language,
what changed and exactly what to do to put the site on the restaurant's new domain.

You do not need to do anything technical yourself. Open Claude Code in this project folder and
type:

> **Read GO-LIVE.md and help me go live, one step at a time.**

Claude will walk you through the steps below, one at a time, and check each one worked before
moving on. The rest of this page is so you know what is happening and why.

---

## 1. What changed

### What's new

- **The site now defends itself against spam and bots.** Before, anyone could submit the
  booking form or the enquiry form thousands of times a minute. Each submission sends the
  owner an email and a WhatsApp, and sends the customer a confirmation email — so a bot could
  have flooded the owner's phone, used up the whole day's email allowance (so real bookings
  got no emails), and got the restaurant's new email domain marked as spam. Now each visitor
  can submit a few times every ten minutes, and there is a hidden trap that quietly discards
  bot submissions.
- **The admin login is protected against password guessing.** Ten wrong attempts and that
  visitor is locked out for fifteen minutes.
- **Search engines are now told about the site properly**: a site map, a "do not index the
  admin pages" rule, and a preview image so that when someone shares the link on WhatsApp or
  Instagram it shows the buffet photo instead of a blank box.

### What's fixed

- **Every admin action now double-checks you are logged in.** Before, there was one door
  guard at the front; now each room checks too. Nothing was open, but one line of protection
  is not enough for a site that holds customers' names and phone numbers.
- **The admin session can no longer be secured with a weak key.** The site now refuses to
  work unless the secret key you give it is long and random (see step 5 below).
- **Photo uploads only accept real photos.** JPG, PNG or WebP, up to 4 MB. Every photo is
  re-saved by the server before storing, which proves it really is a photo and strips hidden
  data. Anything else is rejected with a clear message.
- **Dates are checked properly.** A booking for a date that does not exist, or for last week,
  is now refused with a friendly message instead of a vague error.
- **Standard browser security headers** are sent with every page (stops the site being
  embedded inside someone else's page, among other things).
- **Small cleanups**: leftover sample icons removed, one library updated to clear a security
  advisory, clearer error messages on the login page, better developer documentation.

### What did NOT change

- The design, menu, gallery, reservation and enquiry pages look and behave exactly the same
  for customers.
- The admin panel looks the same. Uploading a photo now shows a clear message if the file is
  too big or not a photo.

### One decision only the owner can make

Today, when a customer books a table, the site **immediately** emails them "Your reservation
is confirmed" — nobody at the restaurant checks first. A party of 40 at 8 PM is confirmed the
moment they click. That was the original design and it is fine if the owner is happy to honour
every booking that arrives (the WhatsApp alert is their heads-up). If the owner would rather
check first, tell me and I will change the customer email to "We've received your request and
will confirm shortly" and add a confirm button in the admin panel. Decide this before launch.

---

## 2. Going live — baby steps

Do these in order. Each step says what you need, what to do, and how you know it worked.
Claude Code can do the typing for most of them; the parts only you can do are marked **You**.

### Before you start — gather the logins

You (or the owner) need to be able to sign in to:

1. **Vercel** — where the website runs.
2. **Supabase** — where bookings, enquiries, menus and photos are stored.
3. **Resend** — sends the emails.
4. The **domain registrar** — where the owner bought the domain (GoDaddy, Namecheap, etc.).
5. The **owner's phone** with WhatsApp, for the WhatsApp alerts.

If any of these were created by someone else, get access now; every step below needs one of
them.

### Step 1 — Set up the database (Supabase)

- **You need:** the Supabase login.
- **Do this:** in the Supabase project, open *SQL Editor → New query*. Ask Claude to give you
  the database setup text from the project; paste it in and press *Run*.
- **It worked when:** under *Table Editor* you see five tables — daily_menu, reservations,
  gallery_images, reviews, enquiries — each showing "RLS enabled", and under *Storage* there is
  a bucket called **site-images** marked *Public*.
- Then go to *Project Settings → API* and keep this tab open — you will need the **Project
  URL** and the **service_role** key (not the anon key) in step 5. Never paste that key into
  a chat or a message; you will type it straight into Vercel.

### Step 2 — Set up email (Resend)

- **You need:** the Resend login and the domain registrar login.
- **Do this (You):** in Resend, *Domains → Add domain* and enter the restaurant's domain.
  Resend shows you three or four DNS records. Log in to the registrar, open the domain's DNS
  settings, and add each record exactly as shown. Come back to Resend and press *Verify*.
- **It worked when:** the domain shows **Verified** in Resend. This can take from a few
  minutes to a few hours. Then create an API key (*API Keys → Create*) and keep that tab open
  for step 5.
- **Why it matters:** without this, confirmation emails land in spam or are rejected outright.

### Step 3 — Set up WhatsApp alerts (CallMeBot)

- **You need:** the owner's phone.
- **Do this (Owner):** save **+34 644 59 71 67** as a contact, then WhatsApp it the message
  `I allow callmebot to send me messages`. Within a minute it replies with a personal API key.
- **It worked when:** the reply with the key arrives. Keep it for step 5.

### Step 4 — Create the admin password and the secret key

- **Do this:** ask Claude to do this step. It will ask you to choose an admin password (16+
  characters, kept in a password manager — this is the only login to the admin panel), then
  give you two commands to run in your own terminal. One turns your password into a scrambled
  "hash"; the other generates a long random secret key. Copy both results somewhere safe for
  step 5 — do not paste them into the chat.
- **It worked when:** you have a hash that starts with `$2` and a secret key that is a long
  string of random letters and numbers.

### Step 5 — Enter the settings in Vercel

- **You need:** the Vercel login, plus everything from steps 1–4.
- **Do this (You):** in the Vercel project, open *Settings → Environment Variables*. Add each
  of these. Claude can read them out one by one and tell you which value goes where.

  | Setting name | What to put |
  | --- | --- |
  | `NEXT_PUBLIC_SUPABASE_URL` | Project URL from Supabase (step 1) |
  | `SUPABASE_SERVICE_ROLE_KEY` | service_role key from Supabase (step 1) |
  | `RESEND_API_KEY` | API key from Resend (step 2) |
  | `RESEND_FROM_EMAIL` | `Parilyahan Sa Kalye <reservations@THE-DOMAIN>` using the verified domain |
  | `OWNER_NOTIFICATION_EMAIL` | the email address the owner reads |
  | `CALLMEBOT_PHONE` | owner's WhatsApp number, digits only, with country code (e.g. `9715...`) |
  | `CALLMEBOT_APIKEY` | the key from step 3 |
  | `ADMIN_PASSWORD_HASH` | the hash from step 4 — **paste it exactly as generated, with its `$` signs and no backslashes** |
  | `ADMIN_SESSION_SECRET` | the secret key from step 4 |
  | `NEXT_PUBLIC_SITE_NAME` | `Parilyahan Sa Kalye` |
  | `NEXT_PUBLIC_SITE_URL` | the final address, e.g. `https://www.THE-DOMAIN` (fill after step 6 if unsure) |
  | `GOOGLE_PLACES_API_KEY` | optional — leave empty for now; reviews can be added by hand in the admin panel |

- **Watch out:** the developer notes say to write `\$` in front of dollar signs. That rule is
  **only** for the settings file on a computer. In Vercel, paste the plain hash. If you put
  backslashes in Vercel, every login will fail with "Incorrect password".
- **It worked when:** all rows are saved. Then *Deployments → ⋯ on the latest → Redeploy*.

### Step 6 — Connect the domain

- **You need:** the Vercel login and the registrar login.
- **Do this (You):** in Vercel, *Settings → Domains → Add* and enter the domain (add both
  `www.the-domain` and `the-domain`). Vercel shows the DNS records to add. Add them at the
  registrar, the same way as in step 2.
- **It worked when:** Vercel shows a green tick next to the domain and the site opens in a
  browser with a padlock in the address bar. This can take up to a day, usually much less.
- Then set `NEXT_PUBLIC_SITE_URL` in step 5's list to the final address and redeploy once
  more.

### Step 7 — Test it like a customer, then like the owner

Do every one of these on the live address. Claude can check the technical ones for you.

1. Open the site on a phone. Home, Menu, Gallery, About all load.
2. Make a **real test reservation** with your own email and phone. Within a minute: the owner
   gets an email and a WhatsApp; you get a confirmation email (check spam the first time).
3. Send a test **enquiry**. The owner gets an email and a WhatsApp.
4. Go to `/admin`. Try a **wrong** password — it must say "Incorrect password". Then the right
   one — you land on the Menu tab.
5. Save today's menu; open the public Menu page — it shows.
6. Upload a photo in *Gallery*; open the public Gallery page — it shows.
7. Delete your test reservation and enquiry from Supabase (*Table Editor*), so the owner's
   first real bookings are not mixed with tests.
8. Open a private/incognito window and visit `the-domain/api/admin/menu`. It must say
   "Unauthorized". That proves the admin is locked.

### Step 8 — Hand the keys to the owner

Add the owner as a member of the Vercel project, the Supabase project, the Resend account and
the domain registrar. Give them the admin password through a password manager or in person,
not over chat. Businesses lose their websites when the one person with the logins moves on.

### Step 9 — Optional but recommended (any time after launch)

- **Shared rate-limit counter.** The spam protection works out of the box, but counts per
  server. For a shared counter, create a free Redis database at upstash.com, copy its REST URL
  and token into Vercel as `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, and
  redeploy. Nothing else to change.
- **Monthly backup.** Supabase's free plan has no automatic backups. Once a month, in *Table
  Editor*, export the reservations and enquiries tables to CSV and keep the files.
- **Google reviews on the home page.** When ready, get a Google Places API key and add it as
  `GOOGLE_PLACES_API_KEY`. Until then, paste genuine reviews by hand in *Admin → Reviews*.

---

## 3. Known limits

- Bookings have no seat limit and confirm instantly (see the owner decision above).
- WhatsApp alerts use a free hobby service (CallMeBot) with no guarantee. Email is the
  reliable channel; WhatsApp is the nudge.
- Only one admin account exists. There is no "forgot password" — if it is lost, a new hash has
  to be set in Vercel (step 4 again).

---

## 4. For Claude Code

*This section is for the AI assistant Ritik is working with. Ritik: you can stop reading here.*

Ritik is not technical. When he asks for help going live, guide him through Section 2 **one
step at a time**: state what he needs for the step, do the parts you can do, wait for him to
confirm the "it worked when" check, then move on. Keep language plain; no file names, hashes
or jargon in what you say to him unless he must type it.

Ground rules:

- **Never ask him to paste a password, API key, or the session secret into the chat**, and
  never enter one anywhere yourself. He types them directly into the Vercel dashboard. If a
  value shows up in the chat by accident, tell him to rotate it.
- **Step 1:** print the contents of `supabase/schema.sql` for him to paste into the Supabase
  SQL editor. Do not connect to his database yourself.
- **Step 4:** give him two PowerShell commands to run in his own terminal (the Run button is
  fine), so the results never appear in the chat:
  - hash: `node scripts/hash-password.mjs "HIS-PASSWORD"` — remind him to replace the
    placeholder and that the password must be 16+ characters.
  - secret: `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`
  - Tell him the hash goes into `ADMIN_PASSWORD_HASH` exactly as printed (plain `$`, no
    backslashes — the `\$` rule in `.env.local.example` is for local files only) and the
    secret into `ADMIN_SESSION_SECRET`. The app refuses secrets under 32 characters.
- **Step 5:** walk the variable table one row at a time. `README.md` and
  `.env.local.example` describe each variable.
- **Step 7:** you can verify the technical checks with curl against the live domain: `/`
  returns 200 with `X-Frame-Options: DENY`; `/robots.txt` and `/sitemap.xml` exist;
  `/api/admin/menu` without a cookie returns 401; `/admin/dashboard/menu` redirects to
  `/admin`; a POST to `/api/reservations` with `{}` returns 400 and the sixth in ten minutes
  returns 429. Do **not** create real reservations yourself — Ritik does that from a browser
  so the emails go to him.
- **Do not change code** unless a step fails because of a bug, and then explain what you are
  changing before you do it. Do not push to `main` without asking him. `npm run lint`,
  `npm run typecheck` and `npm run build` must pass before any push.
- If Vercel's build fails on `sharp`, that is the image library; the fix is usually to
  redeploy with the build cache cleared. It is a normal dependency and installs on Vercel's
  Linux builders.
- The security review this guide came from is in the git history (commits `ea78827` and
  `7348e2e`, 19 Sep 2026). `README.md` explains the stack and each setting.
