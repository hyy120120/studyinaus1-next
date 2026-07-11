# GoStudyInAustralia — Next.js Edition

A clean Next.js 16 (App Router) + JavaScript rebuild of the original Emergent
project. Visually and functionally identical to the original, with the
Emergent platform, its CMS/visual-edits tooling, and the MongoDB/FastAPI
backend fully removed. You now own 100% of the code.

## What changed vs. the original

- **Framework**: Create React App + react-router-dom + craco → **Next.js App
  Router**, file-based routing, native `metadata` API for SEO (replaces the
  `useSEO` hook — better for real SEO since it's server-rendered).
- **Backend**: The Python/FastAPI + MongoDB backend (`backend/`) is gone.
  - The **visa scoring engine** was ported 1:1 to `lib/scoring.js` and now
    runs client-side — no network round trip.
  - **Data storage** (visa applications, course inquiries) and **admin
    login** now use **Firebase** (Firestore + Firebase Auth) — see setup
    below. This was your choice for a zero-maintenance, fully-owned data
    layer with no custom server to run.
  - **PDF report generation** was ported from ReportLab to `lib/pdf.js`
    (jsPDF), generated in the browser — no server needed.
  - **Email delivery** and the **AI (LLM) counselor assessment** — both of
    which depended on Emergent-specific keys — were removed, per your
    request. The rule-based score, breakdown, strengths/weaknesses/
    recommendations, and PDF download all work exactly as before.
  - The **course catalog** is now local, editable data at
    `data/courses.js` (was a CMS/DB-backed endpoint).
- **Emergent removed everywhere**: the `emergent-main.js` script tag, the
  bundled PostHog analytics snippet, `@emergentbase/visual-edits`, the
  `craco.config.js` health-check plugin, and the `home-emergent-link` test
  id are all gone. There is nothing left that talks to Emergent.
- **Animations** (the only visual change you approved): added Framer Motion
  scroll-reveal animations (`components/Reveal.jsx`) and Lenis for buttery
  inertia smooth-scrolling (`components/Providers.jsx`), plus a few subtle
  hover/transition micro-interactions. No layout, copy, spacing, or color
  changed.

## Getting started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## Firebase setup (required for the calculator, course inquiries, and admin dashboard)

1. Create a project at console.firebase.google.com.
2. Enable **Firestore Database** (production mode) and **Authentication →
   Email/Password**.
3. Deploy [`firestore.rules`](./firestore.rules). It makes public forms
   create-only, requires consent on calculator submissions, preserves consent
   logs as immutable records, and restricts all reads to users with the
   Firebase custom claim `admin: true`.

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
     }
   }
   ```

4. Create your admin user under Authentication → Users (e.g.
   `admin@gostudyinaustralia.com` + a password of your choice) — this
   replaces the old seeded Mongo admin account. The admin dashboard lives at
   `/RKAZN` (not linked anywhere in the site UI — bookmark it). Set the
   Firebase custom claim `admin: true` for that user with the Admin SDK, then
   sign out and back in so the token refreshes. An authenticated user without
   this claim must not be treated as an administrator.
5. Copy `.env.local.example` to `.env.local` and fill in your Firebase Web
   App config (Project settings → General → Your apps → SDK setup and
   config).

Until `.env.local` is configured, the calculator/PDF still works (using a
local, non-persisted id), but course inquiries and the admin dashboard will
show a clear error instead of failing silently.

## Project structure

```
app/                     Routes (App Router) + metadata per page
components/               Header, Footer, Reveal (scroll animation), Providers
components/ui/            shadcn/radix component library (unchanged, "use client" added)
components/calculator/    Calculator wizard (client component)
components/result/        Result report page (client component)
components/courses/       Course catalog + inquiry form (client component)
components/admin/         Admin login + dashboard (client component)
data/courses.js           Editable local course catalog
lib/scoring.js            Rule-based visa scoring engine (ported from Python)
lib/pdf.js                Client-side PDF report builder (ported from ReportLab)
lib/firebase.js           Firebase client SDK init
constants/testIds/        data-testid registry (used for e2e testing)
```

## Notes

- All UI, layout, copy, colors, and functionality are unchanged from the
  original — the only intentional visual additions are the scroll-reveal
  and smooth-scroll animations described above.
- The project is JavaScript-only, no TypeScript.
