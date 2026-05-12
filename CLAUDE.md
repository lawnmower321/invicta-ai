@AGENTS.md
# Invicta AI — Claude Code Instructions

## Project Overview

Wholesale real estate operating system for investors who acquire, flip, and assign properties.
Tagline: "Unconquered"
Root: `C:\Users\bmo72\invicta-ai`

Core workflows: manage leads through a pipeline, analyze deals, find cash buyers, close assignments.

---

## Design Identity

You are an exceptional UI/UX designer as much as you are an engineer. Invicta AI has a
premium, tactical aesthetic — think war room, not generic SaaS. When building UI, ask
yourself: would a senior product designer at Linear or Vercel be proud of this? If not,
push further. Every screen should feel like it was crafted, not generated.

### Design Principles
- Every interaction should feel intentional — spacing, weight, and motion all carry meaning
- Data should feel alive — numbers, stages, and statuses have visual weight
- Micro-interactions matter — hover states, transitions, and feedback make the tool feel
  premium without being flashy
- Restraint over decoration — every element earns its place
- Dark theme is the identity, not an option — lean into it

### Space & Layout — Critical
- **Eliminate dead space** — every gap between elements should be intentional and tight.
  If a section feels empty, fill it with relevant data, a subtle pattern, or collapse it.
  Empty space is wasted real estate in a real estate app.
- **Density over sparseness** — pack information purposefully. Users should feel like they
  have everything they need at a glance, not like they're hunting for data.
- **Symmetry is non-negotiable** — grids must align. Cards in a row must be equal height.
  Columns must be balanced. If one side feels heavier than the other, fix it.
- **Consistent gutters** — pick a spacing unit and stick to it religiously across every
  page. Never mix arbitrary padding values. Use the Tailwind spacing scale strictly.
- **Full-width thinking** — components should fill their containers confidently. Avoid
  narrow centered content with large empty margins unless it is intentional hierarchy.
- **Bento grid discipline** — when using grid layouts, every cell must have visual weight.
  No cell should look like a placeholder. Size cells proportionally to their content importance.

### Symmetry Rules
- Action buttons in a group: equal width or icon-only, never mixed
- KPI cards: always same height in a row, evenly spaced, equal column widths
- Form fields: label alignment must be consistent across the entire form
- Modal/sheet widths: standardized — never arbitrary pixel values
- Pipeline columns: equal width on desktop, full width on mobile tabs
- Two-column layouts: neither side should feel visually heavier than the other

### Animation Rules (Framer Motion)
- Entrance animations: fade + slight upward translate, 200-300ms ease-out
- Stage transitions on pipeline: smooth horizontal slide
- Number changes (KPIs, deal math): count-up animation
- Destructive actions: subtle shake before confirm
- Page transitions: fade, never jarring hard cuts
- Never animate for the sake of it — motion should communicate state change

### Typography Hierarchy
- Data/numbers: heavier weight, slightly larger, monospace where appropriate
- Labels: muted, smaller, uppercase with letter-spacing
- Actions: clear contrast, never ambiguous
- Consistent line-height — text should never feel cramped or floaty

### What Bad UI Looks Like Here
- Generic cards with default shadcn and zero customization
- Padding that feels accidental or inconsistent
- Hover states that do nothing
- Forms that look like forms
- Empty sections with no empty-state designed
- Misaligned columns or uneven card heights
- One side of a layout visually heavier than the other
- Large blank areas with no purpose

---

## Color Tokens — Always Use These, Never Hardcode Colors

```css
--invicta-green    /* primary action, profit, closed deals */
--invicta-blue     /* info, links, secondary actions */
--invicta-purple   /* AI features, buyer matching */
--invicta-amber    /* warnings, follow-up alerts */
--invicta-red      /* destructive actions, negative spread */
```

Dark theme is default. Never assume light mode.

---

## Tech Stack — Read Before Writing Any Code

- **Next.js 16.2.4** — App Router only. No Pages Router. Before writing any Next.js code,
  check `node_modules/next/dist/docs/` for breaking changes vs prior versions.
- **React 19.2.4** with TypeScript 5 — use the new `use()` hook patterns where appropriate.
- **TailwindCSS v4** — config syntax changed significantly. Use CSS variables for theming,
  not tailwind.config.js color extensions. Do NOT use v3 patterns.
- **Supabase** — PostgreSQL + Auth + Realtime. RLS is enabled on ALL tables.
- **Anthropic SDK** `@anthropic-ai/sdk v0.92.0` — for AI routes.
- **shadcn/ui + Lucide React** — use existing shadcn components before building custom ones.
- **No global state manager** — local React hooks + Supabase subscriptions only.
  Do NOT introduce Redux, Zustand, Jotai, or any state library.

---

## Architecture Rules

- RLS is enabled on all tables — always write queries that respect auth context
- Never query without `supabase.auth.getUser()` context on protected routes
- Realtime subscriptions active on `leads` and `lead_activity` tables
- Rentcast comps are cached in-memory for 24h — do NOT re-fetch on every render
- No global state — local React hooks + Supabase subscriptions only
- All Supabase calls in server actions or API routes — never expose service key client-side
- Page-level accent flows via `--page-accent` (set by `PageShell`). Nested `SectionHeader` and `EmptyState` inherit it by default unless overridden. `Spinner` is the one exception — it inherits `currentColor` from its parent context (button text, body, etc.) so it works inside arbitrary containers.

---

## Business Logic Constants — Never Change These

```typescript
// MAO Formula
MAO = (ARV × mao_factor%) - Repairs
// Default mao_factor: 70% (user-configurable in profiles)

// Spread
Spread = MAO - Ask Price

// Discount to ARV
Discount = ((ARV - Ask Price) / ARV) × 100%

// Condition Levels → repair cost % of ARV preset
CONDITION_LEVELS = ['light', 'moderate', 'major', 'gut']
```

---

## Pipeline Stages — In Order

```
New → Contacted → Qualified → Offer Made → Under Contract → Closed
```

- Stage changes MUST be logged to `lead_activity` table (immutable audit trail)
- Pipeline claim = assign lead to user + move to stage
- Pipeline release = unassign + return to pool
- Never skip stages programmatically without explicit user action

---

## Database — Key Tables

```
leads         — id, address, owner_name, phone, email, ask_price, arv, repair_est,
                beds, baths, sqft, year_built, source, stage, notes, assigned_to,
                created_at, updated_at

profiles      — id (FK auth.users), display_name, partner_name, phone, company,
                target_markets, min_price, max_price, mao_factor, prop_types

buyers        — id, name, phone, email, markets[], min_price, max_price,
                prop_types[], cash_proof, deals_completed, notes, created_by

followups     — id, text, lead_id, lead_label, due_date, done, priority, user_id

lead_activity — id, lead_id, user_id, action, details, created_at  ← IMMUTABLE
```

---

## AI Routes — Models Are Intentional, Do Not Change

```
POST /api/score          → claude-haiku-4-5-20251001
                           Scores leads 1-10, returns priority + reason + mentor call note

POST /api/parse          → claude-sonnet-4-6
                           Extracts lead fields from unstructured pasted text

POST /api/buyer-campaign → claude-sonnet-4-6
                           Generates Email, SMS, Facebook, Instagram, Direct Mail copy
```

---

## Layout Rules

- **Mobile-first** — bottom nav on mobile, fixed sidebar on desktop
- Breakpoint for sidebar switch: `lg` (1024px)
- Never use `position: fixed` for modals on mobile — use sheets/drawers instead
- Pipeline: drag-drop on desktop, tabs on mobile

---

## Pages Reference

| Route | Purpose |
|-------|---------|
| /dashboard | KPI cards, bento grid feature tiles |
| /pipeline | Kanban board — the core workflow page |
| /leads/[id] | Lead detail — contact, deal numbers, AI tools |
| /scraper | CSV upload + AI lead scoring |
| /comps | Rentcast comparable sales |
| /calculator | ARV/MAO/ROI deal calculator |
| /buyers | Cash buyer network + lead matching |
| /call | Call center with inline calculator |
| /followups | Task manager |
| /analytics | Team KPIs and funnel view |
| /learn | Educational content |
| /settings | Profile, company, markets |

---

## Code Style

- TypeScript strict mode — no `any` types
- Functional components only — no class components
- Co-locate component files with their page where possible
- Server Components by default — only add `"use client"` when you need hooks or browser APIs
- Prefer `async/await` over `.then()` chains
- Error boundaries on all major page sections

---

## Development utilities

- `/dev/components` (dev-only route, hidden in production via `NODE_ENV` guard) is the visual reference for every shared component variant in `components/invicta/`. When adding a new variant or component, update this route so the variant has a documented visual sample. This route is how design regressions get caught before they hit real pages.

---

## What NOT To Do

- Do NOT introduce any global state library
- Do NOT use Pages Router — App Router only
- Do NOT hardcode colors — use CSS tokens
- Do NOT change AI model assignments without being asked
- Do NOT add optimistic UI without also handling the error revert case
- Do NOT write raw SQL — use Supabase query builder
- Do NOT fetch Rentcast on every render — respect the 24h cache
- Do NOT assume light mode anywhere
- Do NOT leave empty states undesigned — every section needs a zero-data view
- Do NOT use arbitrary spacing values — stick to the Tailwind spacing scale
- Do NOT ship misaligned grids or uneven card heights