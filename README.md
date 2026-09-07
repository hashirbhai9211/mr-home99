# MR.HOME — International Luxury Real Estate Platform

Full-stack Next.js 16 (App Router) + PostgreSQL (Drizzle ORM) platform: cinematic 3D public website, CMS, CRM, media manager, RBAC admin, audit log, SEO and security hardening.

## First run

1. `npm install`
2. Set `DATABASE_URL` in `.env` (see `.env.example`). Apply the schema: `npx drizzle-kit push`
3. `npm run build && npm start` (or `npm run dev`)
4. The database self-seeds on first request with the 10 markets, sample projects, homepage sections, navigation, legal pages and settings. (Manual: `npx tsx src/db/seed-cli.ts`)
5. Open **/admin** → you are taken to **/admin/setup** to create the password for `ceo@mrhome.com`. There is **no default password** and nothing is stored in plaintext (scrypt hashing). Set `ADMIN_SETUP_TOKEN` to lock this screen down further.

## Admin control centre (`/admin`)

| Area | What it controls |
| --- | --- |
| Settings | Brand, logo/favicon, colours, phone, WhatsApp, email, addresses, offices, hours, social links, footer, copyright text, SEO defaults, analytics IDs, WhatsApp templates, newsletter, inquiry form fields, intro video, cookie/disclaimer text |
| Content | Every homepage/page section: titles, eyebrows, copy, CTAs, images, video, items (cards/stats/steps), order, enable/disable |
| Navigation | Header/footer labels, URLs, order, visibility, dropdown nesting |
| Projects / Markets | Full CRUD, draft/publish, feature, archive, duplicate, reorder, authenticated preview of drafts |
| Media | Upload (MIME/extension/magic-byte/dimension validation), search/filter/sort, alt/caption, replace in place, usage tracking, delete |
| Leads / CRM | Statuses NEW→CONTACTED→QUALIFIED→CONVERTED/LOST/ARCHIVED, assignment, notes, tasks/follow-ups, activity + contact history, bulk actions, CSV export |
| Users | SUPER_ADMIN / ADMIN / EDITOR with server-side permissions, activate/deactivate, role changes, password reset |
| Audit Logs | Login/logout, password, user, content, project, market, settings, media, lead and publish events |

The footer year is generated from the current calendar year automatically (`© {year} {copyrightText}`).

## Security

Scrypt password hashing · HttpOnly/SameSite/Secure session cookies · session expiry & rotation · login throttling (5 failures / 15 min lockout) · lead rate limiting (5 / 10 min per IP) + honeypot · Origin-checked mutations (CSRF) · Zod validation everywhere · parameterised queries · CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy · safe error messages · admin/API/drafts `noindex`.

## Intro video

Uses the supplied Cloudinary asset with Cloudinary's `ac_none` transformation so the production derivative has **no audio track**; falls back to the original (muted) if the derivative fails, then to the live hero if autoplay is blocked. Skippable, `prefers-reduced-motion` aware, shown once per session.
