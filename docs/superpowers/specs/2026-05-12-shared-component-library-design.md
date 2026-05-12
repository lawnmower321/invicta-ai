# Shared Component Library — Design Spec

**Date:** 2026-05-12
**Status:** Approved
**Scope:** Foundational UI primitives for Invicta AI — `KpiCard`, `LeadCard`, `StatBadge`, `SectionHeader`, `EmptyState`, `Spinner`, plus updates to `PageShell` and a shared `useScrolled` hook.

---

## 1. Background & Goal

The Invicta codebase has solid design tokens (`globals.css` defines a complete CSS variable system) but no shared component layer above shadcn primitives. Every page rebuilds the same card, badge, header, and empty-state patterns inline. This causes:

- **Color drift** — opacity variants `15` / `18` / `20` / `25` / `40` applied inconsistently per page
- **Density drift** — `p-3` / `p-4` / `p-5` / `p-6` chosen ad hoc
- **Symmetry violations** — KPI cards uneven height, action buttons mixed widths, columns visually unbalanced
- **Missing empty states** — some pages have detailed empty designs, some have one-line text, some have nothing
- **Hardcoded hex colors** — `#00e676`, `#ff5252`, `#e040fb` used in places where CSS tokens should be

This library establishes the single source of truth for the components that appear on every page, enforcing the symmetry, density, and accent rules from `CLAUDE.md`.

## 2. Non-goals

- **No migration of existing pages.** The library is additive. Page rework is a separate prompt sequence.
- **No animation library integration.** Framer Motion and GSAP arrive in a follow-up prompt. Components are structured so motion wraps cleanly later without API changes.
- **No blueprint texture utility.** Deferred to a polish prompt after the core components are validated.
- **No full skeleton system.** Only `LeadCardSkeleton` ships in v1 to support list-loading states.
- **No `EmptyError` preset.** Route-level errors use Next.js `error.tsx`; in-component fetch failures render `<EmptyState />` with a retry action.

## 3. Architecture

### 3.1 Namespace

All new components live in `components/invicta/`. The existing `components/ui/` (shadcn primitives) and `components/PageShell.tsx`, `components/Sidebar.tsx` are untouched except where explicitly noted.

### 3.2 Single import surface

A barrel `components/invicta/index.ts` re-exports every public component. All consumers import from `@/components/invicta` — no deep imports.

```tsx
import { KpiCard, KpiGrid, LeadCard, StatBadge, SectionHeader, EmptyState, Spinner } from '@/components/invicta'
```

### 3.3 Shared types & token utility

**`components/invicta/types.ts`**
```ts
export type AccentColor = 'green' | 'blue' | 'purple' | 'amber' | 'red' | 'neutral'

// Each component defines its own size union — sizes vary by component (StatBadge has 'xs', EmptyState has 'compact', etc.)
// No shared Size type — would be misleading since no two components use the same range.

export type Lead = {
  id: string
  address: string
  owner_name?: string | null
  phone?: string | null
  ask_price?: number | null
  arv?: number | null
  repair_est?: number | null
  source?: string | null
  stage?: PipelineStage
  score?: number               // 1-10 (scored variant only)
  priority?: 'high' | 'medium' | 'low'
  mentor_note?: string | null
}

export type PipelineStage = 'new' | 'contacted' | 'qualified' | 'offer' | 'contract' | 'closed'
```

**`components/invicta/tokens.ts`**
```ts
export function accent(color: AccentColor): {
  solid: string   // 'var(--invicta-green)' etc.
  soft: string    // 'rgb(0 230 118 / 0.12)'
  border: string  // 'rgb(0 230 118 / 0.30)'
  glow: string    // 'rgb(0 230 118 / 0.18)'
  fg: string      // 'var(--invicta-green)'
}
```

Single source of truth for opacity variants. Kills the `15`/`18`/`20`/`25` chaos — every consumer asks for `accent('green').soft`, never writes opacity manually.

**`components/invicta/presets.constants.ts`**
```ts
export const SCORE_THRESHOLDS = { high: 8, medium: 5 } as const  // ≥8 green, ≥5 amber, else red
export const SPREAD_NEUTRAL_RANGE = 0 as const                    // exactly 0 is neutral
```

Business logic — thresholds and ranges — externalized from UI. When AI scoring retunes, one file changes.

### 3.4 Density & convention contract

**Padding scale (cards & containers)** — strictly enforced:
- `p-2` (8px) — ultra-tight, list-row only (e.g., `LeadCard` `compact` variant for dropdown stacking). Always paired with a `min-h` floor for touch targets.
- `p-3` (12px) — compact density (e.g., `LeadCard` `pool` / `kanban`)
- `p-4` (16px) — default (`KpiCard`, most cards)
- `p-5` (20px) — hero/feature density (`KpiCard` feature variant)
- **Never** `p-6`, `p-8`, or arbitrary values on cards

**Gap scale (grids inside a section):**
- `gap-2` (8px) — tight grids
- `gap-3` (12px) — standard

**Radius scale:**
- `rounded-lg` (8px) — badges, small chips
- `rounded-xl` (12px) — cards
- `rounded-2xl` (16px) — hero containers only

**Border convention** (Vercel-style restraint):
- Default card: `border border-white/[0.08]`
- Hover: `border-white/[0.16]`
- Accent: `accent(color).border`
- Section divider: `border-white/[0.06]` (subtler than card borders)

**Typography:**
- Numbers/data: `font-mono tabular-nums font-bold` — count-up ready, no digit jitter
- Labels: `text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground`
- Card titles: `text-sm font-semibold`
- Page titles (PageShell): `text-xl md:text-2xl font-bold tracking-tight leading-tight truncate`

### 3.5 Page accent cascade

`PageShell` sets a scoped CSS variable on its outer wrapper:
```tsx
<div style={{ '--page-accent': accent(props.accent ?? 'neutral').solid }}>
```

**Inheritance mechanism:** `SectionHeader` and `EmptyState` accept `accent?: AccentColor` (optional). When the prop is omitted or `undefined`, the component reads its accent values from `var(--page-accent)` directly via inline style (e.g., `color: var(--page-accent, var(--invicta-green))` with a green fallback when no `PageShell` wraps the component). When the prop is explicitly set — including `accent="neutral"` — the local prop wins. This is intentional: passing `neutral` is an explicit override, not an opt-out.

Consumers can always override locally. This implements the "one dominant color per page" rule from the audit at the architecture level.

**CLAUDE.md addition** (single new line under Architecture Rules):
> Page-level accent flows via `--page-accent` (set by `PageShell`). Nested `SectionHeader` and `EmptyState` inherit it by default unless overridden.

## 4. Components

### 4.1 KpiCard + KpiGrid

**Files:** `components/invicta/KpiCard.tsx`

**`KpiCard` props:**
```ts
type KpiCardProps = {
  label: string                    // "Pipeline Value"
  value: string | number
  format?: 'currency' | 'number' | 'percent' | 'raw'   // default 'raw'
  icon?: LucideIcon                                    // right-aligned, 14px
  accent?: AccentColor                                 // default 'neutral'
  trend?: { dir: 'up' | 'down' | 'flat'; value: string }
  hint?: string                                        // secondary text below value
  variant?: 'default' | 'feature'                      // default 'default'
  loading?: boolean                                    // shimmer skeleton
  href?: string                                        // makes the card a Link
}
```

**Behavior:**
- Numbers render with `tabular-nums` — no horizontal jitter on value changes
- `format` handles currency/number/percent formatting internally (eliminates per-page `fmt()` helpers)
- `loading: true` renders shimmer skeleton at the value position, matching value height exactly — no layout shift on resolve
- `trend.dir === 'flat'` renders muted-foreground color, no arrow, same baseline (prevents "broken" feel for cards without movement)
- Hover (only when `href` set): **entire card** translates `translateY(-1px)`, border brightens to `white/[0.16]`, 150ms ease-out. The value text stays put.
- All KPI cards in a row are equal height (`h-full` + parent `auto-rows-fr`)

**Visual layout (default):**
- `p-4 rounded-xl border border-white/[0.08]`
- Label top-left (caps treatment), icon top-right (accent.fg)
- Value `text-3xl font-mono tabular-nums font-bold` below label
- Trend `text-xs` below value (color: accent for dir, muted-foreground for flat)

**Visual layout (feature):**
- `p-5 rounded-2xl`
- Border: `accent.border`
- Background: `accent.soft`
- Value scales to `text-4xl`
- Inset glow: `box-shadow: inset 0 0 0 1px {accent.border}, 0 0 24px -8px {accent.glow}`

**`KpiGrid` wrapper:**
```ts
type KpiGridProps = {
  cols?: 2 | 3 | 4    // default 4
  children: ReactNode
}
```
Renders a CSS grid with `auto-rows-fr` (equal heights), `gap-3` (12px), responsive: 2 columns on mobile, `cols` on `md+`. Single source of truth for KPI row layout.

### 4.2 LeadCard

**Files:** `components/invicta/LeadCard.tsx`

**Props:**
```ts
type LeadCardProps = {
  lead: Lead
  variant: 'pool' | 'kanban' | 'scored' | 'compact'
  selected?: boolean
  dragging?: boolean
  onClick?: (id: string) => void
  onAction?: (action: 'claim' | 'release' | 'delete' | 'add', id: string) => void
  showActions?: boolean
  stageColor?: AccentColor       // override stage color (rare)
}
```

**Variant: `pool`**
- `p-3 rounded-xl border border-white/[0.08]`
- 3px left accent border (driven by source or stage color)
- Address bold (`text-sm font-bold truncate`)
- Meta row: owner + source on left, ask price right-aligned
- No actions

**Variant: `kanban`**
- Same base as `pool` plus:
  - Owner avatar (20px, 2-letter initials, `accent.soft` background)
  - `SpreadBadge` below meta row
  - On hover with `showActions`: action strip slides up from card bottom — "Claim" / "Release" / "View" with `⌘` shortcut hints (Raycast-style command UX)
- `dragging` state: `opacity: 0.4`, `scale: 1.02`, `box-shadow` accent glow

**Variant: `scored`**
- `p-4 rounded-xl border` with priority-driven accent border
- Left: square score badge (`rounded-lg`, `accent.soft`, `text-2xl font-mono` number)
- Right: priority label above address (uppercase, accent.fg, `text-[10px]`)
- Address + owner + phone + ask/ARV in compact stack
- Mentor note row separator (`border-t border-white/[0.06]`) **only renders when `mentor_note` is non-null/non-empty** — collapses entirely when null, no empty space
- Mentor note row: 💡 icon + amber accent text + right-side `+ Add` action button

**Variant: `compact`**
- `p-2 rounded-lg` single-row layout
- `text-xs` truncated
- **`min-h-9` (36px) enforced** for mobile touch targets
- Address · owner · price on one line
- Used in Call Center lead-selector dropdown

**Cross-variant behavior:**
- Card-level hover: `translateY(-1px)` + border brightens to `white/[0.16]`
- `selected: true`: `box-shadow: 0 0 0 1px accent.solid` outline (no layout shift)
- Address `truncate` with native `title` attribute for full address on hover
- `compact` ignores `showActions` (no room)

**`LeadCardSkeleton`:**
Sibling component matching each variant's exact height. Shimmer animation on address/meta positions. Used in lists while data loads.

### 4.3 StatBadge + presets

**Files:**
- `components/invicta/StatBadge.tsx` — base component
- `components/invicta/badges/StageBadge.tsx`
- `components/invicta/badges/PriorityBadge.tsx`
- `components/invicta/badges/SourceBadge.tsx`
- `components/invicta/badges/SpreadBadge.tsx`
- `components/invicta/badges/ScoreBadge.tsx`

**`StatBadge` props:**
```ts
type StatBadgeProps = {
  label: string
  accent?: AccentColor                          // default 'neutral'
  size?: 'xs' | 'sm' | 'md'                     // default 'sm'
  icon?: LucideIcon
  variant?: 'soft' | 'outline' | 'solid'        // default 'soft'
  pulse?: boolean                               // breathing dot, for LIVE indicators
}
```

**Variants:**
- `soft` — `bg: accent.soft`, transparent border, `text: accent.fg` — default; Vercel-style restraint
- `outline` — transparent bg, `border: accent.border`, `text: accent.fg` — for cards with already-tinted backgrounds where soft would disappear
- `solid` — `bg: accent.solid`, no border, dark foreground — high emphasis only

**Sizing:**
- `xs` — `text-[10px] px-1.5 py-0.5 rounded-md` — inline with text
- `sm` — `text-[11px] px-2 py-1 rounded-md` — default, card metadata rows
- `md` — `text-xs px-2.5 py-1.5 rounded-lg` — prominent placement

All sizes share: `font-bold uppercase tracking-[0.08em] inline-flex items-center gap-1 whitespace-nowrap`.

**Presets** (thin wrappers, ~5 lines each):
- `<StageBadge stage={...} />` — maps pipeline stage → accent + label
- `<PriorityBadge priority={...} />` — maps high/medium/low → accent
- `<SourceBadge source={...} />` — maps known source strings → accent
- `<SpreadBadge value={...} />` — auto-colors: positive = green, negative = red, `=== SPREAD_NEUTRAL_RANGE` = neutral
- `<ScoreBadge score={...} />` — auto-colors from `SCORE_THRESHOLDS` constants (≥8 green, ≥5 amber, else red)

**Constraints (intentional):**
- No `onClick` — badges are display-only; wrap in `<button>` if interactive
- No truncation — labels too long are a copy problem, not a component problem
- No `tooltip` prop — caller composes with tooltip primitive

### 4.4 SectionHeader

**File:** `components/invicta/SectionHeader.tsx`

**Props:**
```ts
type SectionHeaderProps = {
  title: string
  eyebrow?: string
  hint?: string
  count?: number
  accent?: AccentColor             // default 'neutral'; inherits var(--page-accent) when neutral
  action?: ReactNode
  divider?: boolean                // default true
  size?: 'sm' | 'md'               // default 'md'
}
```

**Visual (md, default):**
- Title: `text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground`
- Eyebrow (when present): `text-[9px] tracking-[0.18em] opacity-60` above title
- Count badge: inline, accent-driven, separated by `border-l border-white/[0.08] pl-2 ml-2` (Vercel-style detail divider)
- Action slot: right-aligned with constraint
- Divider: `border-b border-white/[0.06]`, `pb-2 mb-3`
- Accent-tinted divider: when `accent !== 'neutral'`, replace the solid bottom border with `border-image: linear-gradient(to right, accent.border, transparent) 1`. When `accent === 'neutral'`, stay with the solid `border-white/[0.06]` — a gradient from a neutral border would be visually identical to no border, defeating the purpose.

**Visual (sm):**
- Title: `text-[10px]` tighter
- No count badge by default
- No bottom divider by default
- Used inside cards titling sub-groups

**Action slot constraint (critical):**
- Wrapper has `shrink-0 max-w-[50%]` on mobile, `max-w-none` on `md+`
- Title section has `min-w-0 flex-1 truncate`
- Title always wins the space race on narrow viewports — action cannot push title off the left edge

**Eyebrow opacity verification:**
- `opacity-60` is the locked value
- During implementation, visually verify against both `--background` (#0a0a0f) and `--surface` (#111118)
- If eyebrow disappears on either, switch to `text-muted-foreground/60` (theme-variable-tracked opacity) instead of raw opacity-60

**Constraints (intentional):**
- No collapse/expand toggle — out of scope, would be a separate `CollapsibleSection` component
- No icon on title — labels stay typographic
- Does not wrap children — header is a sibling to section content, not a container

### 4.5 EmptyState

**Files:**
- `components/invicta/EmptyState.tsx` — base component
- `components/invicta/empty/EmptyLeads.tsx`
- `components/invicta/empty/EmptyResults.tsx`
- `components/invicta/empty/EmptyPipeline.tsx`

**Props:**
```ts
type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  accent?: AccentColor                         // default 'neutral'; inherits var(--page-accent)
  action?: {
    label: string
    onClick?: () => void
    href?: string                              // mutually exclusive with onClick
    icon?: LucideIcon
  }
  secondaryAction?: {
    label: string
    onClick?: () => void
    href?: string
  }
  size?: 'compact' | 'sm' | 'md' | 'lg'        // default 'md'
}
```

**Note:** `texture?: boolean` is **NOT** in v1. Deferred to polish prompt.

**Sizing:**
- `compact` — `p-4`, NO icon container box, icon inline at 16px next to title, title `text-sm`, no description by default
- `sm` — `py-6 px-4`, icon box `40×40`, for empty kanban columns / drawer sections
- `md` — `py-10 px-6`, icon box `48×48`, default
- `lg` — `py-16 px-8`, icon box `64×64`, title `text-base`, whole-page empty states

**Visual base:**
- Container: `border border-white/[0.06] border-dashed rounded-xl`
- Icon box: `accent.soft` background, `rounded-xl`, accent.fg icon
- Title: `text-sm font-semibold` (default) / `text-base` (lg)
- Description: `text-xs text-muted-foreground` line
- Primary action button: accent-driven, standard button treatment
- Secondary action: text-only link, `accent.fg` color, trailing arrow icon, hover underline

**Error state convention:**
- In-component fetch failures: render `<EmptyState />` with neutral accent, error icon, retry action
- Route-level errors: use Next.js `error.tsx`
- No `EmptyError` preset — keeps one pattern per failure mode

**Presets:**
- `<EmptyLeads />` — "No leads in pool" + Add lead CTA
- `<EmptyResults />` — search/filter zero state
- `<EmptyPipeline stage={...} />` — empty kanban column, accent inherits stage color

### 4.6 Spinner

**File:** `components/invicta/Spinner.tsx`

**Props:**
```ts
type SpinnerProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg'      // 12 / 16 / 20 / 24px
  accent?: AccentColor                  // default 'neutral'; inherits var(--page-accent) when neutral
  label?: string                        // optional inline label, text-xs muted
}
```

**Visual:**
- Wraps `Loader2` from lucide-react with `animate-spin`
- Color: `accent.fg`
- Optional label renders inline to the right, `text-xs text-muted-foreground`
- When label is present, container is `inline-flex items-center gap-2`

**Replaces:**
- Every existing `<Loader2 size={X} className="animate-spin" style={{ color: ... }} />` instance
- Page-level loaders (e.g., the Analytics full-screen loader) become `<Spinner size="lg" />` centered

## 5. PageShell update

**File:** `components/PageShell.tsx` (in-place update — not a new file)

**Changes:**

1. **Width cap removed**
   - `max-w-[1000px] mx-auto` → `w-full`
   - Pages now fill viewport minus sidebar

2. **Title typography**
   - `text-lg` → `text-xl md:text-2xl`
   - Adds `tracking-tight leading-tight`

3. **New props:**
```ts
type PageShellProps = {
  title: string
  eyebrow?: string                     // NEW
  subtitle?: string
  back?: boolean
  action?: ReactNode
  accent?: AccentColor                 // NEW — sets --page-accent
  subBar?: ReactNode                   // NEW — sticky second row
  children: ReactNode
}
```

4. **Eyebrow slot** — same treatment as `SectionHeader` eyebrow: `text-[10px] tracking-[0.18em] opacity-60` above title

5. **Accent flow-through** — outer wrapper sets `style={{ '--page-accent': accent(props.accent ?? 'neutral').solid }}`. `SectionHeader` and `EmptyState` inherit by default.

6. **Header height**
   - Mobile: `h-12` when no eyebrow, `h-14` when eyebrow present
   - Desktop: `h-14` (unchanged)

7. **Header backdrop**
   - Border becomes `border-white/[0.06]`
   - When scrolled (via `useScrolled`): `backdrop-blur-md bg-background/80`
   - When at top: solid `bg-background`

8. **subBar slot**
   - Renders below the title row when provided
   - Adds 40px to sticky header total
   - Same horizontal padding as title row
   - Used by Follow-ups, Scraper, Buyers for filter tabs that currently inline awkwardly

**Out of scope for PageShell:**
- No breadcrumb component
- No automatic action sizing (caller responsibility)
- No page-level loading state (pages handle their own loading inside `children`)

## 6. Shared hook

**File:** `lib/hooks/useScrolled.ts`

```ts
export function useScrolled(threshold = 8): boolean
```

- Pure hook, no external dependencies
- Listens to `window.scroll` with passive listener
- Returns `boolean` — `true` when `scrollY > threshold`
- Cleans up listener on unmount
- Used by `PageShell` for conditional backdrop-blur on scroll
- Available for future sticky surfaces (drawer headers, modal headers, sub-bar transitions)

## 7. Verification surface

**File:** `app/dev/components/page.tsx`

- New route at `/dev/components`
- Guards: rendered only when `process.env.NODE_ENV !== 'production'` (route file returns `notFound()` in production)
- Shows every component in every variant on one page
- Acts as living documentation and regression check
- CLAUDE.md update: a note under a new "Development utilities" subsection that Claude Code updates this route when adding new component variants

## 8. CLAUDE.md updates

Two additions (consolidated, single edit):

**Under Architecture Rules:**
> Page-level accent flows via `--page-accent` (set by `PageShell`). Nested `SectionHeader` and `EmptyState` inherit it by default unless overridden.

**New subsection "Development utilities":**
> `/dev/components` (dev-only route) is the visual reference for every shared component variant. When adding a new variant or component to `components/invicta/`, update this route so the variant has a documented visual sample.

## 9. File tree (final)

```
components/
├── invicta/
│   ├── types.ts
│   ├── tokens.ts
│   ├── presets.constants.ts
│   ├── KpiCard.tsx                   (KpiCard + KpiGrid)
│   ├── LeadCard.tsx                  (LeadCard + LeadCardSkeleton)
│   ├── StatBadge.tsx
│   ├── SectionHeader.tsx
│   ├── EmptyState.tsx
│   ├── Spinner.tsx
│   ├── badges/
│   │   ├── StageBadge.tsx
│   │   ├── PriorityBadge.tsx
│   │   ├── SourceBadge.tsx
│   │   ├── SpreadBadge.tsx
│   │   └── ScoreBadge.tsx
│   ├── empty/
│   │   ├── EmptyLeads.tsx
│   │   ├── EmptyResults.tsx
│   │   └── EmptyPipeline.tsx
│   └── index.ts                      (barrel — all public re-exports)
├── ui/                               (untouched)
└── PageShell.tsx                     (UPDATED in-place)

lib/
└── hooks/
    └── useScrolled.ts                (NEW)

app/
└── dev/
    └── components/
        └── page.tsx                  (NEW — dev-only verification route)

docs/
└── superpowers/
    └── specs/
        └── 2026-05-12-shared-component-library-design.md   (this spec)

CLAUDE.md                             (two additions)
```

## 10. Component call-site reduction (before → after)

**Before** — Dashboard KPI row (inline, ~30 lines per card):
```tsx
<div className="grid grid-cols-4 gap-2 md:gap-3">
  <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold tracking-widest uppercase opacity-60">Pipeline Value</span>
      <DollarSign size={14} style={{ color: '#00e676' }} />
    </div>
    <div className="text-2xl font-bold mt-2">{fmt(kpis.pipelineValue)}</div>
  </div>
  {/* repeat 3 more times */}
</div>
```

**After:**
```tsx
<KpiGrid cols={4}>
  <KpiCard label="Pipeline Value" value={kpis.pipelineValue} format="currency" icon={DollarSign} accent="green" />
  <KpiCard label="Active Leads"   value={kpis.activeLeads}   icon={Users}      accent="blue"  />
  <KpiCard label="In Pool"        value={kpis.poolCount}     icon={Inbox}      accent="amber" />
  <KpiCard label="Deals Closed"   value={kpis.closedDeals}   icon={Target}     accent="purple" />
</KpiGrid>
```

## 11. Open questions deferred to later prompts

- Framer Motion / GSAP integration (animation layer prompt)
- Blueprint dot-grid texture for `EmptyState` (polish prompt)
- Page-by-page migration to consume the library (per-page rework prompts)
- Skeleton primitive system beyond `LeadCardSkeleton` (future prompt)
- Global command palette (`⌘K`) referenced in inspiration analysis (separate feature)

## 12. Success criteria

This prompt is done when:

1. All files listed in §9 exist and compile under TypeScript strict mode
2. `/dev/components` renders every component in every variant without runtime errors
3. No existing page is modified — the library is purely additive
4. `globals.css`, `CLAUDE.md` updates land as documented in §3.5 and §8
5. No hardcoded hex values appear anywhere in `components/invicta/` — everything routes through `accent()` or CSS variables
6. Existing pages continue to render exactly as before (no regressions)
