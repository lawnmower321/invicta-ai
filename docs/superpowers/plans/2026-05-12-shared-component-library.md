# Shared Component Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared component library defined in [`docs/superpowers/specs/2026-05-12-shared-component-library-design.md`](../specs/2026-05-12-shared-component-library-design.md) — `KpiCard`, `LeadCard`, `StatBadge`, `SectionHeader`, `EmptyState`, `Spinner`, badge & empty presets, `useScrolled` hook, `PageShell` update, and a dev-only `/dev/components` verification route.

**Architecture:** Prop-driven flat APIs (no CVA/compound patterns) for the new components. Single `accent()` token utility maps `AccentColor` unions to derived CSS values (solid/soft/border/glow/fg) — kills the opacity-variant chaos flagged in the audit. `--page-accent` CSS variable cascades from `PageShell` so `SectionHeader` and `EmptyState` inherit a page-level accent. Spinner intentionally inherits `currentColor` instead so it works inside arbitrary parent contexts (buttons, cards, destructive actions).

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript 5 (strict) · TailwindCSS v4 · `lucide-react` for icons · `clsx` + `tailwind-merge` via existing `cn()` at `@/lib/utils`. No new dependencies. No test runner exists; verification is via the progressively-built `/dev/components` route and the TypeScript build.

**Verification convention** (used in every task):
- TypeScript build: `npx tsc --noEmit` should pass after each task.
- Visual check: `npm run dev` then visit `http://localhost:3000/dev/components` — confirm the variants added by the task render without runtime errors and look correct against the audit's design rules (dense, symmetric, accent-consistent, no hardcoded hex).
- Existing pages should still render unchanged — the library is purely additive until separate page-rework prompts consume it.

---

## Task 1: Foundation files (types, tokens, constants)

Establish the single source of truth for accent color tokens and shared types. This is the bedrock every other component depends on.

**Files:**
- Create: `components/invicta/types.ts`
- Create: `components/invicta/tokens.ts`
- Create: `components/invicta/presets.constants.ts`

- [ ] **Step 1: Create `components/invicta/types.ts`**

```ts
export type AccentColor = 'green' | 'blue' | 'purple' | 'amber' | 'red' | 'neutral'

export type PipelineStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'offer'
  | 'contract'
  | 'closed'

// Each component declares its own size union. Sizes vary by component
// (StatBadge has 'xs', EmptyState has 'compact', etc.) — no shared Size type
// would be misleading since no two components use the same range.

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
  score?: number               // 1-10, only set for scored variant
  priority?: 'high' | 'medium' | 'low'
  mentor_note?: string | null
}
```

- [ ] **Step 2: Create `components/invicta/tokens.ts`**

Maps each `AccentColor` to its raw RGB triplet so we can produce consistent opacity variants without callers writing `15`/`18`/`20`/`25` magic numbers anywhere. The neutral case routes to `--muted-foreground`.

```ts
import type { AccentColor } from './types'

export type AccentTokens = {
  solid: string   // e.g. 'var(--invicta-green)' or 'var(--muted-foreground)'
  soft: string    // 12% opacity background tint
  border: string  // 30% opacity border
  glow: string    // 18% opacity glow/inset
  fg: string      // foreground color, same as solid
}

// Raw RGB triplets — must match the hex values in app/globals.css :root
const ACCENT_RGB: Record<AccentColor, string> = {
  green: '0 230 118',     // #00e676
  blue: '68 138 255',     // #448aff
  purple: '224 64 251',   // #e040fb
  amber: '255 171 64',    // #ffab40
  red: '255 82 82',       // #ff5252
  neutral: '107 107 138', // matches --muted-foreground (#6b6b8a)
}

export function accent(color: AccentColor): AccentTokens {
  const rgb = ACCENT_RGB[color]
  const solid = color === 'neutral' ? 'var(--muted-foreground)' : `var(--invicta-${color})`
  return {
    solid,
    soft: `rgb(${rgb} / 0.12)`,
    border: `rgb(${rgb} / 0.30)`,
    glow: `rgb(${rgb} / 0.18)`,
    fg: solid,
  }
}
```

- [ ] **Step 3: Create `components/invicta/presets.constants.ts`**

```ts
// Business-logic thresholds extracted from UI components.
// When the AI scoring model retunes or pricing semantics shift,
// edit here — no component code changes required.

export const SCORE_THRESHOLDS = {
  high: 8,    // score >= 8 -> green accent
  medium: 5,  // score >= 5 -> amber accent (else red)
} as const

export const SPREAD_NEUTRAL_RANGE = 0 as const  // exactly 0 is neutral; >0 green, <0 red
```

- [ ] **Step 4: Verify TypeScript build**

Run: `npx tsc --noEmit`
Expected: passes with no new errors.

- [ ] **Step 5: Commit**

```bash
git add components/invicta/types.ts components/invicta/tokens.ts components/invicta/presets.constants.ts
git commit -m "feat(invicta): foundation — types, accent() token utility, preset constants"
```

---

## Task 2: useScrolled hook

Shared scroll-state hook so every sticky surface uses the same threshold logic.

**Files:**
- Create: `lib/hooks/useScrolled.ts`

- [ ] **Step 1: Create the directory if needed**

```bash
mkdir -p lib/hooks
```
(PowerShell: `New-Item -ItemType Directory -Path "lib\hooks" -Force | Out-Null`)

- [ ] **Step 2: Write `lib/hooks/useScrolled.ts`**

```ts
"use client"

import { useEffect, useState } from "react"

/**
 * Returns true when window.scrollY exceeds the threshold (default 8px).
 * Passive listener, cleans up on unmount. Used by PageShell for the
 * sticky-header backdrop-blur trigger and any future sticky surfaces.
 */
export function useScrolled(threshold: number = 8): boolean {
  const [scrolled, setScrolled] = useState<boolean>(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()  // sync initial state in case the page loads scrolled
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [threshold])

  return scrolled
}
```

- [ ] **Step 3: Verify TypeScript build**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add lib/hooks/useScrolled.ts
git commit -m "feat(hooks): add useScrolled — shared scroll-state for sticky surfaces"
```

---

## Task 3: /dev/components stub + verification route

Create the dev-only route now so every subsequent task can add its components to a visible reference and verify them in the browser as soon as they land. Empty stub initially.

**Files:**
- Create: `app/dev/components/page.tsx`

- [ ] **Step 1: Create the route file**

```tsx
import { notFound } from "next/navigation"

export default function DevComponentsPage() {
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <div className="min-h-screen p-8" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <header className="mb-8">
        <div className="text-[10px] tracking-[0.18em] opacity-60 uppercase font-bold mb-1">
          Development
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Component Reference</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Visual reference for every shared component variant in <code>components/invicta/</code>.
          Hidden in production via <code>NODE_ENV</code> guard.
        </p>
      </header>

      <main className="space-y-12">
        {/* Sections will be added progressively as components land. */}
        <div className="text-xs text-muted-foreground">No components added yet.</div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify the route renders**

Run `npm run dev` (in a separate terminal) and visit `http://localhost:3000/dev/components`. You should see "Component Reference" with the placeholder text. No console errors.

- [ ] **Step 3: Verify production guard**

Build the app: `npm run build` then inspect that the route is excluded from production (the `notFound()` call will return a 404 in production). You do not need to actually deploy — the build succeeding is enough.

- [ ] **Step 4: Commit**

```bash
git add app/dev/components/page.tsx
git commit -m "feat(dev): add /dev/components verification route (dev-only)"
```

---

## Task 4: Spinner component

Simplest component first to establish the pattern. Inherits `currentColor` by default — the one component in the library that does NOT cascade from `--page-accent`.

**Files:**
- Create: `components/invicta/Spinner.tsx`
- Modify: `app/dev/components/page.tsx` (add Spinner section)

- [ ] **Step 1: Write `components/invicta/Spinner.tsx`**

```tsx
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { accent as accentToken } from "./tokens"
import type { AccentColor } from "./types"

type SpinnerSize = "xs" | "sm" | "md" | "lg"

type SpinnerProps = {
  size?: SpinnerSize
  accent?: AccentColor
  label?: string
  className?: string
}

const SIZE_PX: Record<SpinnerSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
}

export function Spinner({ size = "sm", accent, label, className }: SpinnerProps) {
  const pxSize = SIZE_PX[size]
  // Default: inherit currentColor from parent context (button text, body, etc.)
  // accent="neutral" -> explicit muted; accent="green" etc. -> explicit override
  const colorStyle: React.CSSProperties | undefined =
    accent === undefined
      ? undefined
      : accent === "neutral"
      ? { color: "var(--muted-foreground)" }
      : { color: accentToken(accent).fg }

  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      style={colorStyle}
      role="status"
    >
      <Loader2 size={pxSize} className="motion-safe:animate-spin" aria-hidden="true" />
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <span className="sr-only">{label ?? "Loading"}</span>
    </span>
  )
}
```

- [ ] **Step 2: Add a Spinner section to `/dev/components`**

Edit `app/dev/components/page.tsx`. Replace the placeholder `<div className="text-xs text-muted-foreground">No components added yet.</div>` line with:

```tsx
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground pb-2 mb-3 border-b border-white/[0.06]">
            Spinner
          </h2>
          <div className="flex items-center gap-8 flex-wrap">
            <div className="flex items-center gap-2"><Spinner size="xs" /><span className="text-xs">xs · 12px</span></div>
            <div className="flex items-center gap-2"><Spinner size="sm" /><span className="text-xs">sm · 16px (default)</span></div>
            <div className="flex items-center gap-2"><Spinner size="md" /><span className="text-xs">md · 20px</span></div>
            <div className="flex items-center gap-2"><Spinner size="lg" /><span className="text-xs">lg · 24px</span></div>
            <div className="flex items-center gap-2"><Spinner accent="green" /><span className="text-xs">accent green</span></div>
            <div className="flex items-center gap-2"><Spinner accent="amber" /><span className="text-xs">accent amber</span></div>
            <div className="flex items-center gap-2"><Spinner accent="neutral" /><span className="text-xs">accent neutral</span></div>
            <div className="flex items-center gap-2" style={{ color: "var(--invicta-red)" }}>
              <Spinner /><span className="text-xs">currentColor (red parent)</span>
            </div>
            <Spinner size="md" label="Generating campaign..." />
          </div>
        </section>
```

Add this import at the top of `app/dev/components/page.tsx`:

```tsx
import { Spinner } from "@/components/invicta/Spinner"
```

- [ ] **Step 3: Verify TypeScript build**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 4: Visual verification**

Visit `http://localhost:3000/dev/components`. Confirm:
- 4 size variants render at visibly different sizes
- `accent="green"` is the Invicta green
- The "currentColor (red parent)" sample is red (inheriting from parent style)
- The labeled spinner shows "Generating campaign..." inline
- Spinners rotate; with reduced-motion enabled (browser dev tools → Rendering → Emulate CSS prefers-reduced-motion), they freeze

- [ ] **Step 5: Commit**

```bash
git add components/invicta/Spinner.tsx app/dev/components/page.tsx
git commit -m "feat(invicta): Spinner with currentColor default + dev/components entry"
```

---

## Task 5: StatBadge base + 5 preset wrappers

The most reused component in the library. Base `StatBadge` plus the five domain-specific presets that drive readability at call sites.

**Files:**
- Create: `components/invicta/StatBadge.tsx`
- Create: `components/invicta/badges/StageBadge.tsx`
- Create: `components/invicta/badges/PriorityBadge.tsx`
- Create: `components/invicta/badges/SourceBadge.tsx`
- Create: `components/invicta/badges/SpreadBadge.tsx`
- Create: `components/invicta/badges/ScoreBadge.tsx`
- Modify: `app/dev/components/page.tsx`

- [ ] **Step 1: Write `components/invicta/StatBadge.tsx`**

```tsx
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { accent as accentToken } from "./tokens"
import type { AccentColor } from "./types"

export type StatBadgeSize = "xs" | "sm" | "md"

type StatBadgeProps = {
  label: string
  accent?: AccentColor
  size?: StatBadgeSize
  icon?: LucideIcon
  variant?: "soft" | "outline" | "solid"
  pulse?: boolean
}

const SIZE_CLASSES: Record<StatBadgeSize, string> = {
  xs: "text-[10px] px-1.5 py-0.5 rounded-md",
  sm: "text-[11px] px-2 py-1 rounded-md",
  md: "text-xs px-2.5 py-1.5 rounded-lg",
}

const ICON_PX: Record<StatBadgeSize, number> = { xs: 10, sm: 12, md: 14 }
const DOT_SIZE: Record<StatBadgeSize, string> = { xs: "w-1 h-1", sm: "w-1.5 h-1.5", md: "w-1.5 h-1.5" }

export function StatBadge({
  label,
  accent: accentName = "neutral",
  size = "sm",
  icon: Icon,
  variant = "soft",
  pulse = false,
}: StatBadgeProps) {
  const tok = accentToken(accentName)
  const style: React.CSSProperties =
    variant === "soft"
      ? { backgroundColor: tok.soft, color: tok.fg }
      : variant === "outline"
      ? { backgroundColor: "transparent", border: `1px solid ${tok.border}`, color: tok.fg }
      : { backgroundColor: tok.solid, color: "var(--background)" }

  return (
    <span
      className={cn(
        "font-bold uppercase tracking-[0.08em] inline-flex items-center gap-1 whitespace-nowrap",
        SIZE_CLASSES[size]
      )}
      style={style}
    >
      {pulse && (
        <span
          className={cn("inline-block rounded-full motion-safe:animate-pulse", DOT_SIZE[size])}
          style={{ backgroundColor: tok.solid }}
          aria-hidden="true"
        />
      )}
      {Icon && <Icon size={ICON_PX[size]} aria-hidden="true" />}
      <span>{label}</span>
    </span>
  )
}
```

- [ ] **Step 2: Write `components/invicta/badges/StageBadge.tsx`**

```tsx
import { StatBadge, type StatBadgeSize } from "../StatBadge"
import type { AccentColor, PipelineStage } from "../types"

const STAGE_LABELS: Record<PipelineStage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  offer: "Offer",
  contract: "Contract",
  closed: "Closed",
}

const STAGE_ACCENT: Record<PipelineStage, AccentColor> = {
  new: "blue",
  contacted: "amber",
  qualified: "purple",
  offer: "green",
  contract: "green",
  closed: "red",
}

export function StageBadge({ stage, size }: { stage: PipelineStage; size?: StatBadgeSize }) {
  return <StatBadge label={STAGE_LABELS[stage]} accent={STAGE_ACCENT[stage]} size={size} />
}
```

- [ ] **Step 3: Write `components/invicta/badges/PriorityBadge.tsx`**

```tsx
import { StatBadge, type StatBadgeSize } from "../StatBadge"
import type { AccentColor } from "../types"

type Priority = "high" | "medium" | "low"

const PRIORITY_ACCENT: Record<Priority, AccentColor> = {
  high: "red",
  medium: "amber",
  low: "neutral",
}

export function PriorityBadge({ priority, size }: { priority: Priority; size?: StatBadgeSize }) {
  return <StatBadge label={priority} accent={PRIORITY_ACCENT[priority]} size={size} />
}
```

- [ ] **Step 4: Write `components/invicta/badges/SourceBadge.tsx`**

```tsx
import { StatBadge, type StatBadgeSize } from "../StatBadge"
import type { AccentColor } from "../types"

const KNOWN_SOURCES: Record<string, AccentColor> = {
  zillow: "blue",
  mls: "purple",
  driving: "amber",
  facebook: "blue",
  skip: "green",
  auction: "red",
}

export function SourceBadge({ source, size }: { source: string; size?: StatBadgeSize }) {
  const key = source.toLowerCase()
  const a: AccentColor = KNOWN_SOURCES[key] ?? "neutral"
  return <StatBadge label={source} accent={a} size={size} />
}
```

- [ ] **Step 5: Write `components/invicta/badges/SpreadBadge.tsx`**

```tsx
import { StatBadge, type StatBadgeSize } from "../StatBadge"
import { SPREAD_NEUTRAL_RANGE } from "../presets.constants"
import type { AccentColor } from "../types"

function formatSpread(value: number): string {
  const abs = Math.abs(value)
  const sign = value > 0 ? "+" : value < 0 ? "-" : ""
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(0)}k`
  return `${sign}$${abs.toLocaleString()}`
}

export function SpreadBadge({ value, size }: { value: number; size?: StatBadgeSize }) {
  const a: AccentColor =
    value === SPREAD_NEUTRAL_RANGE ? "neutral" : value > SPREAD_NEUTRAL_RANGE ? "green" : "red"
  return <StatBadge label={formatSpread(value)} accent={a} size={size} />
}
```

- [ ] **Step 6: Write `components/invicta/badges/ScoreBadge.tsx`**

```tsx
import { StatBadge, type StatBadgeSize } from "../StatBadge"
import { SCORE_THRESHOLDS } from "../presets.constants"
import type { AccentColor } from "../types"

export function ScoreBadge({ score, size }: { score: number; size?: StatBadgeSize }) {
  const a: AccentColor =
    score >= SCORE_THRESHOLDS.high
      ? "green"
      : score >= SCORE_THRESHOLDS.medium
      ? "amber"
      : "red"
  return <StatBadge label={String(score)} accent={a} size={size} />
}
```

- [ ] **Step 7: Add StatBadge section to `/dev/components/page.tsx`**

Add these imports to the top of the file:

```tsx
import { StatBadge } from "@/components/invicta/StatBadge"
import { StageBadge } from "@/components/invicta/badges/StageBadge"
import { PriorityBadge } from "@/components/invicta/badges/PriorityBadge"
import { SourceBadge } from "@/components/invicta/badges/SourceBadge"
import { SpreadBadge } from "@/components/invicta/badges/SpreadBadge"
import { ScoreBadge } from "@/components/invicta/badges/ScoreBadge"
import { Radio } from "lucide-react"
```

Add this new section inside `<main>`, after the Spinner section:

```tsx
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground pb-2 mb-3 border-b border-white/[0.06]">
            StatBadge — base
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {(["neutral","green","blue","purple","amber","red"] as const).map(a => (
                <StatBadge key={a} label={a} accent={a} />
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatBadge label="xs" accent="green" size="xs" />
              <StatBadge label="sm (default)" accent="green" size="sm" />
              <StatBadge label="md" accent="green" size="md" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatBadge label="soft" accent="purple" variant="soft" />
              <StatBadge label="outline" accent="purple" variant="outline" />
              <StatBadge label="solid" accent="purple" variant="solid" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatBadge label="LIVE" accent="red" pulse />
              <StatBadge label="With icon" accent="blue" icon={Radio} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground pb-2 mb-3 border-b border-white/[0.06]">
            StatBadge — presets
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {(["new","contacted","qualified","offer","contract","closed"] as const).map(s => (
                <StageBadge key={s} stage={s} />
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority="high" />
              <PriorityBadge priority="medium" />
              <PriorityBadge priority="low" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <SourceBadge source="Zillow" />
              <SourceBadge source="MLS" />
              <SourceBadge source="Driving" />
              <SourceBadge source="Unknown" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <SpreadBadge value={12000} />
              <SpreadBadge value={0} />
              <SpreadBadge value={-3500} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <ScoreBadge score={9} />
              <ScoreBadge score={6} />
              <ScoreBadge score={3} />
            </div>
          </div>
        </section>
```

- [ ] **Step 8: Verify TypeScript build**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 9: Visual verification**

Visit `http://localhost:3000/dev/components`. Confirm:
- All six accent colors render with the soft tint
- xs/sm/md sizes visibly increase
- soft/outline/solid variants render distinctly (solid has the strongest visual weight)
- LIVE badge has a breathing dot
- Stage presets render with correct stage→color mapping
- SpreadBadge: +$12k is green, 0 is neutral, -$3500 is red
- ScoreBadge: 9 green, 6 amber, 3 red

- [ ] **Step 10: Commit**

```bash
git add components/invicta/StatBadge.tsx components/invicta/badges/ app/dev/components/page.tsx
git commit -m "feat(invicta): StatBadge + 5 preset badges (Stage/Priority/Source/Spread/Score)"
```

---

## Task 6: KpiCard + KpiGrid

The most-repeated card pattern in the app. Includes the count-up-ready monospace number, hover lift, and feature variant with inset glow.

**Files:**
- Create: `components/invicta/KpiCard.tsx`
- Modify: `app/dev/components/page.tsx`

- [ ] **Step 1: Write `components/invicta/KpiCard.tsx`**

```tsx
import Link from "next/link"
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { accent as accentToken } from "./tokens"
import type { AccentColor } from "./types"

type KpiCardFormat = "currency" | "number" | "percent" | "raw"

type KpiCardProps = {
  label: string
  value: string | number
  format?: KpiCardFormat
  icon?: LucideIcon
  accent?: AccentColor
  trend?: { dir: "up" | "down" | "flat"; value: string }
  hint?: string
  variant?: "default" | "feature"
  loading?: boolean
  href?: string
}

function formatValue(value: string | number, format: KpiCardFormat): string {
  if (typeof value === "string") return value
  switch (format) {
    case "currency":
      return `$${value.toLocaleString()}`
    case "percent":
      return `${value}%`
    case "number":
      return value.toLocaleString()
    case "raw":
    default:
      return String(value)
  }
}

export function KpiCard({
  label,
  value,
  format = "raw",
  icon: Icon,
  accent: accentName = "neutral",
  trend,
  hint,
  variant = "default",
  loading,
  href,
}: KpiCardProps) {
  const tok = accentToken(accentName)
  const isFeature = variant === "feature"

  const cardClasses = cn(
    "block w-full h-full border transition-all duration-150 ease-out",
    isFeature ? "p-5 rounded-2xl" : "p-4 rounded-xl border-white/[0.08]",
    href && "hover:-translate-y-px hover:border-white/[0.16] cursor-pointer"
  )

  const cardStyle: React.CSSProperties = isFeature
    ? {
        borderColor: tok.border,
        backgroundColor: tok.soft,
        boxShadow: `inset 0 0 0 1px ${tok.border}, 0 0 24px -8px ${tok.glow}`,
      }
    : {}

  const trendColor =
    !trend
      ? undefined
      : trend.dir === "up"
      ? "var(--invicta-green)"
      : trend.dir === "down"
      ? "var(--invicta-red)"
      : "var(--muted-foreground)"
  const TrendIcon: LucideIcon | null = !trend
    ? null
    : trend.dir === "up"
    ? TrendingUp
    : trend.dir === "down"
    ? TrendingDown
    : Minus

  const content = (
    <>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
        {Icon && <Icon size={14} style={{ color: tok.fg }} aria-hidden="true" />}
      </div>
      {loading ? (
        <div
          className={cn(
            "rounded-md motion-safe:animate-pulse bg-white/[0.06]",
            isFeature ? "h-10" : "h-8"
          )}
          aria-label="Loading"
        />
      ) : (
        <div className={cn("font-mono tabular-nums font-bold leading-none", isFeature ? "text-4xl" : "text-3xl")}>
          {formatValue(value, format)}
        </div>
      )}
      {trend && !loading && (
        <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: trendColor }}>
          {TrendIcon && <TrendIcon size={12} aria-hidden="true" />}
          <span>{trend.value}</span>
        </div>
      )}
      {hint && !loading && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </>
  )

  if (href) {
    return (
      <Link href={href} className={cardClasses} style={cardStyle}>
        {content}
      </Link>
    )
  }
  return (
    <div className={cardClasses} style={cardStyle}>
      {content}
    </div>
  )
}

type KpiGridProps = {
  cols?: 2 | 3 | 4
  children: React.ReactNode
}

const COLS: Record<NonNullable<KpiGridProps["cols"]>, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
}

export function KpiGrid({ cols = 4, children }: KpiGridProps) {
  return <div className={cn("grid grid-cols-2 gap-3 auto-rows-fr", COLS[cols])}>{children}</div>
}
```

- [ ] **Step 2: Add KpiCard section to `/dev/components/page.tsx`**

Imports:

```tsx
import { KpiCard, KpiGrid } from "@/components/invicta/KpiCard"
import { DollarSign, Users, Inbox, Target } from "lucide-react"
```

New section (append after the StatBadge presets section):

```tsx
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground pb-2 mb-3 border-b border-white/[0.06]">
            KpiCard — default (4-up grid)
          </h2>
          <KpiGrid cols={4}>
            <KpiCard label="Pipeline Value" value={124000} format="currency" icon={DollarSign} accent="green" trend={{ dir: "up", value: "+12%" }} />
            <KpiCard label="Active Leads"   value={47}     icon={Users}      accent="blue"  trend={{ dir: "flat", value: "no change" }} />
            <KpiCard label="In Pool"        value={132}    icon={Inbox}      accent="amber" trend={{ dir: "down", value: "-4" }} />
            <KpiCard label="Deals Closed"   value={9}      icon={Target}     accent="purple" hint="this quarter" />
          </KpiGrid>
        </section>

        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground pb-2 mb-3 border-b border-white/[0.06]">
            KpiCard — feature variant + loading + href
          </h2>
          <KpiGrid cols={3}>
            <KpiCard label="Suggested ARV" value={245000} format="currency" icon={DollarSign} accent="green" variant="feature" />
            <KpiCard label="Loading State" value={0} loading accent="purple" />
            <KpiCard label="Clickable" value={"Pipeline →"} accent="blue" href="/pipeline" />
          </KpiGrid>
        </section>
```

- [ ] **Step 3: Verify TypeScript build**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 4: Visual verification**

Visit `/dev/components`. Confirm:
- All 4 default cards are the same height (auto-rows-fr working)
- Numbers are monospace, large, dominant
- Trend "up" is green with up-arrow, "flat" is muted with minus icon (no arrow direction), "down" is red with down-arrow
- Feature card has the colored border + soft background + inset glow
- Loading card shows a pulsing skeleton bar where the number would be
- Clickable card has hover lift (entire card translates `-1px`, border brightens)
- On mobile (< 768px), grid collapses to 2 columns

- [ ] **Step 5: Commit**

```bash
git add components/invicta/KpiCard.tsx app/dev/components/page.tsx
git commit -m "feat(invicta): KpiCard + KpiGrid with default/feature variants, flat trend, hover lift"
```

---

## Task 7: SectionHeader

In-page section headers with eyebrow, count, action slot, and `--page-accent` inheritance.

**Files:**
- Create: `components/invicta/SectionHeader.tsx`
- Modify: `app/dev/components/page.tsx`

- [ ] **Step 1: Write `components/invicta/SectionHeader.tsx`**

```tsx
import { cn } from "@/lib/utils"
import { accent as accentToken } from "./tokens"
import type { AccentColor } from "./types"

type SectionHeaderProps = {
  title: string
  eyebrow?: string
  hint?: string
  count?: number
  accent?: AccentColor
  action?: React.ReactNode
  divider?: boolean
  size?: "sm" | "md"
}

export function SectionHeader({
  title,
  eyebrow,
  hint,
  count,
  accent: accentProp,
  action,
  divider,
  size = "md",
}: SectionHeaderProps) {
  // Inheritance: when accentProp is omitted, derive from var(--page-accent).
  // When explicitly set (including "neutral"), local prop wins.
  const inherit = accentProp === undefined
  const tok = inherit ? null : accentToken(accentProp)

  const accentFg = inherit ? "var(--page-accent, var(--muted-foreground))" : tok!.fg
  const accentBorderColor = inherit
    ? "var(--page-accent, rgb(255 255 255 / 0.30))"
    : tok!.border

  // Accent-tinted gradient divider only applies when an explicit non-neutral accent is set.
  // Inherited accents and explicit 'neutral' fall back to the solid neutral divider.
  const useGradientDivider = !inherit && accentProp !== "neutral"

  const isMd = size === "md"
  const showDivider = divider ?? isMd

  return (
    <div
      className={cn(
        "flex items-end justify-between gap-3",
        showDivider && "pb-2 mb-3 border-b",
        showDivider && !useGradientDivider && "border-white/[0.06]"
      )}
      style={
        showDivider && useGradientDivider
          ? {
              borderImageSlice: 1,
              borderImageSource: `linear-gradient(to right, ${accentBorderColor}, transparent)`,
            }
          : undefined
      }
    >
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <div className="text-[9px] tracking-[0.18em] opacity-60 uppercase font-bold mb-0.5">
            {eyebrow}
          </div>
        )}
        <div className="flex items-center gap-2 min-w-0">
          <h2
            className={cn(
              "font-bold uppercase truncate text-muted-foreground",
              isMd ? "text-[11px] tracking-[0.14em]" : "text-[10px] tracking-[0.12em]"
            )}
          >
            {title}
          </h2>
          {count !== undefined && isMd && (
            <>
              <span
                className="border-l border-white/[0.08] h-3 inline-block"
                aria-hidden="true"
              />
              <span
                className="text-[10px] font-bold tabular-nums uppercase"
                style={{ color: accentFg }}
              >
                {count}
              </span>
            </>
          )}
          {hint && (
            <span className="text-xs text-muted-foreground truncate">{hint}</span>
          )}
        </div>
      </div>
      {action && (
        <div className="shrink-0 max-w-[50%] md:max-w-none flex items-center gap-2">
          {action}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add SectionHeader section to `/dev/components/page.tsx`**

Imports:

```tsx
import { SectionHeader } from "@/components/invicta/SectionHeader"
```

New section:

```tsx
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground pb-2 mb-3 border-b border-white/[0.06]">
            SectionHeader
          </h2>
          <div className="space-y-6">
            <SectionHeader title="Team Performance" count={4} />
            <SectionHeader title="Property Numbers" eyebrow="Workspace" hint="all values are live" />
            <SectionHeader
              title="Filters"
              count={12}
              accent="purple"
              action={<button className="text-xs px-2 py-1 rounded-md border border-white/[0.08]">+ Add</button>}
            />
            <SectionHeader title="Compact" size="sm" />
            <div style={{ "--page-accent": "var(--invicta-amber)" } as React.CSSProperties}>
              <SectionHeader title="Inherits Amber" count={7} />
            </div>
            <SectionHeader title="No Divider" count={3} divider={false} />
          </div>
        </section>
```

- [ ] **Step 3: Verify TypeScript build**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 4: Visual verification**

Visit `/dev/components`. Confirm:
- Title is uppercase, caps tracking, muted-foreground color
- Count badge sits to the right of title, separated by a thin vertical line
- Eyebrow appears above the title at smaller size
- Action button is right-aligned
- "Inherits Amber" example: count and divider take on the amber color from the wrapping `--page-accent` CSS var
- "No Divider" example has no bottom line
- Resize the browser narrow — the action stays bounded and the title truncates rather than getting pushed off

- [ ] **Step 5: Commit**

```bash
git add components/invicta/SectionHeader.tsx app/dev/components/page.tsx
git commit -m "feat(invicta): SectionHeader with eyebrow, count, action slot, --page-accent inherit"
```

---

## Task 8: EmptyState + 3 preset wrappers

Empty states with accent inheritance. No blueprint texture in v1 (deferred to polish prompt per spec §4.5).

**Files:**
- Create: `components/invicta/EmptyState.tsx`
- Create: `components/invicta/empty/EmptyLeads.tsx`
- Create: `components/invicta/empty/EmptyResults.tsx`
- Create: `components/invicta/empty/EmptyPipeline.tsx`
- Modify: `app/dev/components/page.tsx`

- [ ] **Step 1: Write `components/invicta/EmptyState.tsx`**

```tsx
import Link from "next/link"
import { ArrowRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { accent as accentToken } from "./tokens"
import type { AccentColor } from "./types"

type EmptyStateAction = {
  label: string
  onClick?: () => void
  href?: string
  icon?: LucideIcon
}

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  accent?: AccentColor
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  size?: "compact" | "sm" | "md" | "lg"
}

const SIZE_PAD: Record<NonNullable<EmptyStateProps["size"]>, string> = {
  compact: "p-4",
  sm: "py-6 px-4",
  md: "py-10 px-6",
  lg: "py-16 px-8",
}

const ICON_BOX_PX: Record<NonNullable<EmptyStateProps["size"]>, number> = {
  compact: 0,
  sm: 40,
  md: 48,
  lg: 64,
}

const ICON_PX: Record<NonNullable<EmptyStateProps["size"]>, number> = {
  compact: 16,
  sm: 20,
  md: 24,
  lg: 32,
}

const TITLE_CLASS: Record<NonNullable<EmptyStateProps["size"]>, string> = {
  compact: "text-sm",
  sm: "text-sm",
  md: "text-sm",
  lg: "text-base",
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  accent: accentProp,
  action,
  secondaryAction,
  size = "md",
}: EmptyStateProps) {
  // Inheritance same rule as SectionHeader.
  const inherit = accentProp === undefined
  const tok = inherit ? null : accentToken(accentProp)

  const iconFg = inherit ? "var(--page-accent, var(--muted-foreground))" : tok!.fg
  // Soft background for the icon box: when inheriting, build a low-opacity tint
  // off var(--page-accent) using the relative-color-syntax fallback to muted.
  const iconBg = inherit
    ? "color-mix(in srgb, var(--page-accent, var(--muted-foreground)) 12%, transparent)"
    : tok!.soft

  const actionBorderColor = inherit
    ? "var(--page-accent, rgb(255 255 255 / 0.30))"
    : tok!.border

  const isCompact = size === "compact"
  const boxPx = ICON_BOX_PX[size]
  const iconPx = ICON_PX[size]

  const renderAction = (a: EmptyStateAction, primary: boolean) => {
    const className = primary
      ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-white/[0.04]"
      : "text-xs hover:underline inline-flex items-center gap-1"
    const style: React.CSSProperties = primary
      ? { color: iconFg, borderColor: actionBorderColor }
      : { color: iconFg }
    const inner = (
      <>
        {a.icon && <a.icon size={primary ? 14 : 12} aria-hidden="true" />}
        <span>{a.label}</span>
        {!primary && <ArrowRight size={12} aria-hidden="true" />}
      </>
    )
    if (a.href) {
      return (
        <Link href={a.href} className={className} style={style}>
          {inner}
        </Link>
      )
    }
    return (
      <button type="button" onClick={a.onClick} className={className} style={style}>
        {inner}
      </button>
    )
  }

  return (
    <div
      className={cn(
        "border border-white/[0.06] border-dashed rounded-xl flex flex-col items-center justify-center text-center",
        SIZE_PAD[size]
      )}
    >
      {isCompact ? (
        <div className="flex items-center gap-2 mb-1">
          <Icon size={iconPx} style={{ color: iconFg }} aria-hidden="true" />
          <h3 className={cn("font-semibold", TITLE_CLASS[size])}>{title}</h3>
        </div>
      ) : (
        <>
          <div
            className="flex items-center justify-center rounded-xl mb-3"
            style={{
              width: boxPx,
              height: boxPx,
              backgroundColor: iconBg,
              color: iconFg,
            }}
            aria-hidden="true"
          >
            <Icon size={iconPx} />
          </div>
          <h3 className={cn("font-semibold mb-1", TITLE_CLASS[size])}>{title}</h3>
        </>
      )}
      {description && !isCompact && (
        <p className="text-xs text-muted-foreground mb-3 max-w-sm">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-2">
          {action && renderAction(action, true)}
          {secondaryAction && renderAction(secondaryAction, false)}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write `components/invicta/empty/EmptyLeads.tsx`**

```tsx
import { Inbox } from "lucide-react"
import { EmptyState } from "../EmptyState"

type Props = { onAdd?: () => void }

export function EmptyLeads({ onAdd }: Props) {
  return (
    <EmptyState
      icon={Inbox}
      title="No leads in pool"
      description="Add leads via scraper or paste import to start working deals."
      action={onAdd ? { label: "+ Add lead", onClick: onAdd } : undefined}
      secondaryAction={!onAdd ? { label: "Import from scraper", href: "/scraper" } : undefined}
    />
  )
}
```

- [ ] **Step 3: Write `components/invicta/empty/EmptyResults.tsx`**

```tsx
import { SearchX } from "lucide-react"
import { EmptyState } from "../EmptyState"

type Props = { query?: string }

export function EmptyResults({ query }: Props) {
  return (
    <EmptyState
      icon={SearchX}
      title="No matches found"
      description={
        query
          ? `No results for "${query}". Try a different search.`
          : "Try a different filter or search term."
      }
      size="sm"
    />
  )
}
```

- [ ] **Step 4: Write `components/invicta/empty/EmptyPipeline.tsx`**

```tsx
import { Layers } from "lucide-react"
import { EmptyState } from "../EmptyState"
import type { AccentColor, PipelineStage } from "../types"

const STAGE_ACCENT: Record<PipelineStage, AccentColor> = {
  new: "blue",
  contacted: "amber",
  qualified: "purple",
  offer: "green",
  contract: "green",
  closed: "red",
}

export function EmptyPipeline({ stage }: { stage: PipelineStage }) {
  return <EmptyState icon={Layers} title="Drop here" size="sm" accent={STAGE_ACCENT[stage]} />
}
```

- [ ] **Step 5: Add EmptyState section to `/dev/components/page.tsx`**

Imports:

```tsx
import { EmptyState } from "@/components/invicta/EmptyState"
import { EmptyLeads } from "@/components/invicta/empty/EmptyLeads"
import { EmptyResults } from "@/components/invicta/empty/EmptyResults"
import { EmptyPipeline } from "@/components/invicta/empty/EmptyPipeline"
import { Inbox as InboxIcon } from "lucide-react"
```

New section:

```tsx
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground pb-2 mb-3 border-b border-white/[0.06]">
            EmptyState — sizes
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <EmptyState icon={InboxIcon} title="Compact" size="compact" />
            <EmptyState icon={InboxIcon} title="Small" size="sm" description="For empty columns and drawers." />
            <EmptyState icon={InboxIcon} title="Medium (default)" description="Default page-level empty content." action={{ label: "+ Add", onClick: () => {} }} />
            <EmptyState icon={InboxIcon} title="Large" size="lg" description="Whole-page empty state with a wider description." action={{ label: "Get started", onClick: () => {} }} secondaryAction={{ label: "Learn more", href: "/learn" }} />
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground pb-2 mb-3 border-b border-white/[0.06]">
            EmptyState — presets
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <EmptyLeads onAdd={() => {}} />
            <EmptyResults query="123 elm" />
            <EmptyPipeline stage="qualified" />
          </div>
        </section>
```

- [ ] **Step 6: Verify TypeScript build**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 7: Visual verification**

Visit `/dev/components`. Confirm:
- Compact: icon inline next to title, no icon box, tight padding
- Sm/Md/Lg: icon box grows, padding grows, title scale grows at `lg`
- Dashed border on all variants
- Action button has accent-tinted border
- Secondary action: text + right arrow, opens link on click
- EmptyPipeline preset for `qualified` uses purple accent
- All four `EmptyState` cards in the size grid are equal height in their row pairs

- [ ] **Step 8: Commit**

```bash
git add components/invicta/EmptyState.tsx components/invicta/empty/ app/dev/components/page.tsx
git commit -m "feat(invicta): EmptyState (compact/sm/md/lg) + EmptyLeads/Results/Pipeline presets"
```

---

## Task 9: LeadCard + LeadCardSkeleton

The most complex component in the library — four variants in one file, plus a skeleton sibling.

**Files:**
- Create: `components/invicta/LeadCard.tsx`
- Modify: `app/dev/components/page.tsx`

- [ ] **Step 1: Write `components/invicta/LeadCard.tsx`**

```tsx
import { cn } from "@/lib/utils"
import { SpreadBadge } from "./badges/SpreadBadge"
import { accent as accentToken } from "./tokens"
import type { AccentColor, Lead, PipelineStage } from "./types"

type LeadCardVariant = "pool" | "kanban" | "scored" | "compact"

type LeadCardAction = "claim" | "release" | "delete" | "add"

type LeadCardProps = {
  lead: Lead
  variant: LeadCardVariant
  selected?: boolean
  dragging?: boolean
  onClick?: (id: string) => void
  onAction?: (action: LeadCardAction, id: string) => void
  showActions?: boolean
  stageColor?: AccentColor
}

const STAGE_ACCENT: Record<PipelineStage, AccentColor> = {
  new: "blue",
  contacted: "amber",
  qualified: "purple",
  offer: "green",
  contract: "green",
  closed: "red",
}

const PRIORITY_ACCENT: Record<NonNullable<Lead["priority"]>, AccentColor> = {
  high: "red",
  medium: "amber",
  low: "neutral",
}

function fmtPrice(n: number | null | undefined): string {
  if (n == null) return "—"
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`
  return `$${n.toLocaleString()}`
}

function initials(name: string | null | undefined): string {
  if (!name) return "??"
  const parts = name.trim().split(/\s+/)
  const a = parts[0]?.[0] ?? ""
  const b = parts[1]?.[0] ?? ""
  return (a + b).toUpperCase() || "??"
}

function resolveAccent(props: LeadCardProps): AccentColor {
  if (props.stageColor) return props.stageColor
  if (props.lead.stage) return STAGE_ACCENT[props.lead.stage]
  return "neutral"
}

function selectionRing(tok: ReturnType<typeof accentToken>, selected: boolean | undefined): React.CSSProperties {
  if (!selected) return {}
  return { boxShadow: `0 0 0 1px ${tok.solid}` }
}

export function LeadCard(props: LeadCardProps) {
  const { variant } = props
  if (variant === "pool") return <PoolVariant {...props} />
  if (variant === "kanban") return <KanbanVariant {...props} />
  if (variant === "scored") return <ScoredVariant {...props} />
  return <CompactVariant {...props} />
}

function PoolVariant(props: LeadCardProps) {
  const { lead, selected, dragging, onClick } = props
  const accentName = resolveAccent(props)
  const tok = accentToken(accentName)
  return (
    <div
      onClick={() => onClick?.(lead.id)}
      className={cn(
        "relative p-3 rounded-xl border border-white/[0.08] transition-all duration-150 ease-out cursor-pointer",
        "hover:-translate-y-px hover:border-white/[0.16]",
        dragging && "opacity-40 scale-[1.02]"
      )}
      style={{ borderLeft: `3px solid ${tok.solid}`, ...selectionRing(tok, selected) }}
      title={lead.address}
    >
      <div className="text-sm font-bold truncate">{lead.address}</div>
      <div className="flex items-center justify-between mt-1 gap-2">
        <div className="text-xs text-muted-foreground truncate">
          {lead.owner_name ?? "—"}
          {lead.source ? <> · {lead.source}</> : null}
        </div>
        <div className="text-xs font-mono tabular-nums shrink-0">{fmtPrice(lead.ask_price)}</div>
      </div>
    </div>
  )
}

function KanbanVariant(props: LeadCardProps) {
  const { lead, selected, dragging, onClick, onAction, showActions } = props
  const accentName = resolveAccent(props)
  const tok = accentToken(accentName)
  const spread =
    lead.arv != null && lead.ask_price != null && lead.repair_est != null
      ? lead.arv * 0.7 - lead.repair_est - lead.ask_price
      : null
  return (
    <div
      onClick={() => onClick?.(lead.id)}
      className={cn(
        "relative group p-3 rounded-xl border border-white/[0.08] transition-all duration-150 ease-out cursor-pointer",
        "hover:-translate-y-px hover:border-white/[0.16]",
        dragging && "opacity-40 scale-[1.02]"
      )}
      style={{
        borderLeft: `3px solid ${tok.solid}`,
        ...selectionRing(tok, selected),
        ...(dragging ? { boxShadow: `0 0 24px -4px ${tok.glow}` } : {}),
      }}
      title={lead.address}
    >
      <div className="flex items-start gap-2">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold"
          style={{ backgroundColor: tok.soft, color: tok.fg }}
          aria-hidden="true"
        >
          {initials(lead.owner_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold truncate">{lead.address}</div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <div className="text-xs text-muted-foreground truncate">{lead.owner_name ?? "—"}</div>
            <div className="text-xs font-mono tabular-nums shrink-0">{fmtPrice(lead.ask_price)}</div>
          </div>
          {spread != null && (
            <div className="mt-2">
              <SpreadBadge value={Math.round(spread)} size="xs" />
            </div>
          )}
        </div>
      </div>
      {showActions && (
        <div
          className="absolute inset-x-0 bottom-0 px-3 py-2 rounded-b-xl flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "rgb(0 0 0 / 0.5)", backdropFilter: "blur(6px)" }}
        >
          <ActionButton label="Claim" hint="⌘1" onClick={() => onAction?.("claim", lead.id)} />
          <ActionButton label="Release" hint="⌘2" onClick={() => onAction?.("release", lead.id)} />
          <ActionButton label="View" hint="⌘V" onClick={() => onClick?.(lead.id)} />
        </div>
      )}
    </div>
  )
}

function ScoredVariant(props: LeadCardProps) {
  const { lead, selected, onClick, onAction } = props
  const priority = lead.priority ?? "medium"
  const accentName: AccentColor = PRIORITY_ACCENT[priority]
  const tok = accentToken(accentName)
  return (
    <div
      onClick={() => onClick?.(lead.id)}
      className={cn(
        "p-4 rounded-xl border transition-all duration-150 ease-out cursor-pointer",
        "hover:-translate-y-px hover:bg-white/[0.02]"
      )}
      style={{ borderColor: tok.border, ...selectionRing(tok, selected) }}
      title={lead.address}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 font-mono tabular-nums text-2xl font-bold"
          style={{ backgroundColor: tok.soft, color: tok.fg }}
          aria-hidden="true"
        >
          {lead.score ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="text-[10px] font-bold uppercase tracking-[0.12em] mb-0.5"
            style={{ color: tok.fg }}
          >
            {priority}
          </div>
          <div className="text-sm font-bold truncate">{lead.address}</div>
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {lead.owner_name ?? "—"}
            {lead.phone ? <> · {lead.phone}</> : null}
          </div>
          <div className="text-xs font-mono tabular-nums mt-1">
            {fmtPrice(lead.ask_price)} ask
            {lead.arv != null && <> · {fmtPrice(lead.arv)} ARV</>}
          </div>
        </div>
      </div>
      {lead.mentor_note && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-start gap-2">
          <span aria-hidden="true">💡</span>
          <div className="text-xs flex-1" style={{ color: "var(--invicta-amber)" }}>
            <span className="font-semibold uppercase tracking-[0.08em] text-[10px] mr-1">Mentor:</span>
            {lead.mentor_note}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onAction?.("add", lead.id)
            }}
            className="text-xs font-semibold px-2 py-1 rounded-md border shrink-0"
            style={{ color: tok.fg, borderColor: tok.border }}
          >
            + Add
          </button>
        </div>
      )}
    </div>
  )
}

function CompactVariant(props: LeadCardProps) {
  const { lead, selected, onClick } = props
  const accentName = resolveAccent(props)
  const tok = accentToken(accentName)
  return (
    <div
      onClick={() => onClick?.(lead.id)}
      className={cn(
        "min-h-9 p-2 rounded-lg border border-white/[0.08] text-xs flex items-center gap-2 cursor-pointer",
        "hover:bg-white/[0.04]"
      )}
      style={selectionRing(tok, selected)}
      title={lead.address}
    >
      <span className="truncate font-semibold">{lead.address}</span>
      <span className="text-muted-foreground truncate">· {lead.owner_name ?? "—"}</span>
      <span className="ml-auto font-mono tabular-nums shrink-0">{fmtPrice(lead.ask_price)}</span>
    </div>
  )
}

function ActionButton({ label, hint, onClick }: { label: string; hint?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-[0.08em] border border-white/[0.12] hover:bg-white/[0.08]"
    >
      <span>{label}</span>
      {hint && <span className="opacity-50">{hint}</span>}
    </button>
  )
}

// ----------------------------------------------------------------------------
// Skeleton sibling — heights match each variant's resting height exactly so
// list layouts don't shift when data resolves.
// ----------------------------------------------------------------------------

type LeadCardSkeletonProps = { variant: LeadCardVariant }

const SKELETON_HEIGHT: Record<LeadCardVariant, string> = {
  pool: "h-[62px]",
  kanban: "h-[88px]",
  scored: "h-[124px]",
  compact: "h-9",
}

export function LeadCardSkeleton({ variant }: LeadCardSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.06] motion-safe:animate-pulse bg-white/[0.02]",
        SKELETON_HEIGHT[variant],
        variant === "compact" && "rounded-lg"
      )}
      aria-label="Loading lead"
    />
  )
}
```

- [ ] **Step 2: Add LeadCard section to `/dev/components/page.tsx`**

Imports:

```tsx
import { LeadCard, LeadCardSkeleton } from "@/components/invicta/LeadCard"
import type { Lead } from "@/components/invicta/types"
```

Demo data + new section:

```tsx
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground pb-2 mb-3 border-b border-white/[0.06]">
            LeadCard — variants
          </h2>
          {(() => {
            const lead: Lead = {
              id: "demo-1",
              address: "1234 Elm St, Austin TX",
              owner_name: "John Smith",
              phone: "(512) 555-0100",
              ask_price: 185000,
              arv: 245000,
              repair_est: 18000,
              source: "Zillow",
              stage: "qualified",
              score: 9,
              priority: "high",
              mentor_note: "Lead with motivation — ask why they're selling.",
            }
            const leadNoMentor: Lead = { ...lead, id: "demo-2", mentor_note: null, score: 6, priority: "medium" }
            return (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">pool</div>
                  <LeadCard lead={lead} variant="pool" />
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">kanban (with showActions)</div>
                  <LeadCard lead={lead} variant="kanban" showActions />
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">scored — with mentor note</div>
                  <LeadCard lead={lead} variant="scored" />
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">scored — mentor note null (row collapses)</div>
                  <LeadCard lead={leadNoMentor} variant="scored" />
                </div>
                <div className="space-y-2 col-span-2">
                  <div className="text-xs text-muted-foreground">compact (call-center dropdown row)</div>
                  <LeadCard lead={lead} variant="compact" />
                </div>
                <div className="space-y-2 col-span-2">
                  <div className="text-xs text-muted-foreground">selected + dragging states</div>
                  <div className="grid grid-cols-2 gap-2">
                    <LeadCard lead={lead} variant="kanban" selected />
                    <LeadCard lead={lead} variant="kanban" dragging />
                  </div>
                </div>
                <div className="space-y-2 col-span-2">
                  <div className="text-xs text-muted-foreground">skeletons</div>
                  <div className="grid grid-cols-4 gap-2">
                    <LeadCardSkeleton variant="pool" />
                    <LeadCardSkeleton variant="kanban" />
                    <LeadCardSkeleton variant="scored" />
                    <LeadCardSkeleton variant="compact" />
                  </div>
                </div>
              </div>
            )
          })()}
        </section>
```

- [ ] **Step 3: Verify TypeScript build**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 4: Visual verification**

Visit `/dev/components`. Confirm:
- All four variants render distinctly
- Pool: 3px left accent border, address bold, price right-aligned
- Kanban: same plus avatar circle, spread badge below, hovering reveals the action strip at the bottom with `⌘1` / `⌘2` / `⌘V` hints
- Scored: large score badge on left, priority label, mentor note row with amber accent and `+ Add` button
- Scored (no mentor): the divider line and mentor row are absent entirely — card is visibly shorter
- Compact: single row, address + owner + price, at least 36px tall on touch
- Selected state shows the outline ring
- Dragging state shows opacity 0.4 + scale + glow
- Skeleton heights match the resting heights of each variant — placing skeleton next to live cards should produce identical row heights

- [ ] **Step 5: Commit**

```bash
git add components/invicta/LeadCard.tsx app/dev/components/page.tsx
git commit -m "feat(invicta): LeadCard with 4 variants (pool/kanban/scored/compact) + skeleton"
```

---

## Task 10: Update PageShell

In-place update: width cap removed, eyebrow + accent flow-through added, header height conditional on eyebrow, scroll-state backdrop blur via `useScrolled`, subBar slot.

**Files:**
- Modify: `components/PageShell.tsx`

- [ ] **Step 1: Read the current file (familiarization)**

Run: `cat components/PageShell.tsx` (or `Get-Content`). This is in-place editing — make sure you can see the original to avoid losing the back-button + action prop behavior.

- [ ] **Step 2: Replace the file entirely**

Overwrite `components/PageShell.tsx` with:

```tsx
"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useScrolled } from "@/lib/hooks/useScrolled"
import { accent as accentToken } from "@/components/invicta/tokens"
import type { AccentColor } from "@/components/invicta/types"

type Props = {
  title: string
  eyebrow?: string
  subtitle?: string
  back?: boolean
  action?: React.ReactNode
  accent?: AccentColor
  subBar?: React.ReactNode
  children: React.ReactNode
}

export default function PageShell({
  title,
  eyebrow,
  subtitle,
  back,
  action,
  accent: accentName,
  subBar,
  children,
}: Props) {
  const router = useRouter()
  const scrolled = useScrolled(8)

  const pageAccentVar = accentName ? accentToken(accentName).solid : "var(--invicta-green)"
  // Mobile header height: h-12 when no eyebrow, h-14 when eyebrow is present. Desktop is h-14 either way.
  const headerHeightMobile = eyebrow ? "h-14" : "h-12"

  return (
    <div
      className="min-h-screen"
      style={
        {
          background: "var(--background)",
          "--page-accent": pageAccentVar,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          "sticky top-[52px] md:top-0 z-30 border-b transition-colors duration-150 px-5 md:px-8",
          scrolled ? "bg-background/80 backdrop-blur-md" : "bg-background"
        )}
        style={{ borderColor: "rgb(255 255 255 / 0.06)" }}
      >
        <div className={cn("flex items-center justify-between", headerHeightMobile, "md:h-14")}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {back && (
              <button
                onClick={() => router.back()}
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-opacity hover:opacity-60"
                style={{ background: "var(--surface-2)" }}
                aria-label="Go back"
              >
                <ArrowLeft size={15} />
              </button>
            )}
            <div className="min-w-0">
              {eyebrow && (
                <div className="text-[10px] tracking-[0.18em] opacity-60 uppercase font-bold mb-0.5">
                  {eyebrow}
                </div>
              )}
              <h1 className="font-bold text-xl md:text-2xl tracking-tight leading-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p
                  className="text-xs mt-0.5 truncate"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && (
            <div className="shrink-0 ml-3 max-w-[50%] md:max-w-none flex items-center gap-2">
              {action}
            </div>
          )}
        </div>
        {subBar && (
          <div
            className="border-t flex items-center h-10"
            style={{ borderColor: "rgb(255 255 255 / 0.06)" }}
          >
            {subBar}
          </div>
        )}
      </div>

      <div className="px-5 md:px-8 py-5 w-full">{children}</div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript build**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 4: Verify existing pages still render**

Start the dev server (`npm run dev`) and visit:
- `/dashboard`
- `/pipeline`
- `/leads/[any-id]`
- `/analytics`
- `/calculator`

Confirm each page renders, the title looks correct (now larger and tight-tracked), and the back button + action props still work where they're used. Pages should now fill the viewport horizontally (no more 1000px max-width).

- [ ] **Step 5: Commit**

```bash
git add components/PageShell.tsx
git commit -m "feat(PageShell): full-width, tight title tracking, eyebrow + accent flow-through, subBar slot, scroll backdrop-blur"
```

---

## Task 11: Barrel index.ts

Single import surface so consumers can write `import { ... } from '@/components/invicta'`.

**Files:**
- Create: `components/invicta/index.ts`

- [ ] **Step 1: Write `components/invicta/index.ts`**

```ts
// Foundation
export type { AccentColor, Lead, PipelineStage } from "./types"
export { accent } from "./tokens"
export type { AccentTokens } from "./tokens"
export { SCORE_THRESHOLDS, SPREAD_NEUTRAL_RANGE } from "./presets.constants"

// Core components
export { KpiCard, KpiGrid } from "./KpiCard"
export { LeadCard, LeadCardSkeleton } from "./LeadCard"
export { StatBadge } from "./StatBadge"
export { SectionHeader } from "./SectionHeader"
export { EmptyState } from "./EmptyState"
export { Spinner } from "./Spinner"

// Badge presets
export { StageBadge } from "./badges/StageBadge"
export { PriorityBadge } from "./badges/PriorityBadge"
export { SourceBadge } from "./badges/SourceBadge"
export { SpreadBadge } from "./badges/SpreadBadge"
export { ScoreBadge } from "./badges/ScoreBadge"

// Empty-state presets
export { EmptyLeads } from "./empty/EmptyLeads"
export { EmptyResults } from "./empty/EmptyResults"
export { EmptyPipeline } from "./empty/EmptyPipeline"
```

- [ ] **Step 2: Verify barrel works via sample import**

Add a temporary import line at the top of `app/dev/components/page.tsx`:

```tsx
import { KpiCard as KpiCardFromBarrel } from "@/components/invicta"
```

Run: `npx tsc --noEmit`
Expected: passes.

Then remove the line. The barrel is verified.

- [ ] **Step 3: Commit**

```bash
git add components/invicta/index.ts
git commit -m "feat(invicta): barrel index — single import surface for the library"
```

---

## Task 12: CLAUDE.md updates

Two documentation additions per spec §8.

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Locate the "Architecture Rules" section**

Open `CLAUDE.md`. Find the heading `## Architecture Rules`. The section currently ends with the bullet:

```
- All Supabase calls in server actions or API routes — never expose service key client-side
```

- [ ] **Step 2: Append the page-accent bullet**

Add one new bullet to the bottom of the Architecture Rules list:

```markdown
- Page-level accent flows via `--page-accent` (set by `PageShell`). Nested `SectionHeader` and `EmptyState` inherit it by default unless overridden. `Spinner` is the one exception — it inherits `currentColor` from its parent context (button text, body, etc.) so it works inside arbitrary containers.
```

- [ ] **Step 3: Add the Development utilities section**

Find a sensible insertion point — between the "Code Style" section and the "What NOT To Do" section is the right home. Add this new section:

```markdown
---

## Development utilities

- `/dev/components` (dev-only route, hidden in production via `NODE_ENV` guard) is the visual reference for every shared component variant in `components/invicta/`. When adding a new variant or component, update this route so the variant has a documented visual sample. This route is how design regressions get caught before they hit real pages.
```

- [ ] **Step 4: Verify the file still parses**

Open the rendered preview in your editor (or run a markdown linter if available) to confirm the structure is intact. No build step required for CLAUDE.md.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(CLAUDE.md): document --page-accent cascade + /dev/components reference"
```

---

## Task 13: Final integration check

End-to-end verification before declaring the library done.

- [ ] **Step 1: Clean TypeScript build**

Run: `npx tsc --noEmit`
Expected: zero errors across the whole project.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: build succeeds. The `/dev/components` route should not appear in the production routes manifest (it returns `notFound()` in production but Next.js still pre-renders it; that's fine — the page renders a 404 when requested).

- [ ] **Step 3: Existing page regression sweep**

Run `npm run dev` and visit every page listed in CLAUDE.md's Pages Reference table:
- `/dashboard`, `/pipeline`, `/leads/[id]`, `/scraper`, `/comps`, `/calculator`, `/buyers`, `/call`, `/followups`, `/analytics`, `/learn`, `/settings`

Each page should render exactly as before with the only visible differences being:
- Wider content (no 1000px cap)
- Larger and tighter-tracked page title from `PageShell`

No new errors in the browser console. No layout breaks.

- [ ] **Step 4: Library showcase final check**

Visit `/dev/components`. Confirm every section renders without errors and the components match the spec:
- Spinner sizes, colors, currentColor behavior
- StatBadge: all colors, sizes, variants, presets
- KpiCard: default + feature + loading + href hover lift
- SectionHeader: with and without eyebrow, count, action, accent inheritance
- EmptyState: all sizes + presets
- LeadCard: all 4 variants + selected/dragging states + skeletons

- [ ] **Step 5: Confirm no hardcoded hex in `components/invicta/`**

Run (PowerShell):
```powershell
Get-ChildItem -Path components\invicta -Recurse -Include *.tsx,*.ts | Select-String -Pattern '#[0-9a-fA-F]{3,8}\b' -CaseSensitive
```
(or Bash equivalent with `grep -rE '#[0-9a-fA-F]{3,8}\b' components/invicta/`)

Expected output: matches only within comments (the `ACCENT_RGB` comments in `tokens.ts` reference hex values for documentation only — those are fine). No `style={{ color: '#...' }}` or `className` hex values. If any non-comment hex is found, replace it with the `accent()` token utility.

- [ ] **Step 6: No further commits required**

If steps 1–5 pass, the implementation is complete. The library is additive; no migration of existing pages happens in this plan.

---

## Self-review notes

This plan was checked against the spec for coverage. Mapping:

| Spec section | Implemented in task |
|---|---|
| §3.3 Shared types & token utility | Task 1 |
| §3.4 Density & convention contract | Documented in spec; enforced by component code in Tasks 4–9 |
| §3.5 Page accent cascade | Task 10 (PageShell sets it), Tasks 7 & 8 (consumers inherit it) |
| §4.1 KpiCard + KpiGrid | Task 6 |
| §4.2 LeadCard + LeadCardSkeleton | Task 9 |
| §4.3 StatBadge + 5 presets | Task 5 |
| §4.4 SectionHeader | Task 7 |
| §4.5 EmptyState + 3 presets | Task 8 |
| §4.6 Spinner | Task 4 |
| §5 PageShell update | Task 10 |
| §6 useScrolled hook | Task 2 |
| §7 /dev/components verification route | Task 3 (stub) + Tasks 4–9 (progressive build-out) |
| §8 CLAUDE.md updates | Task 12 |
| §9 File tree | All tasks combined |
| §12 Success criteria | Task 13 |

No spec section is uncovered. Each task is independently verifiable.
