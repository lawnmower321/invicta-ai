"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { SpreadBadge } from "./badges/SpreadBadge"
import { accent as accentToken } from "./tokens"
import { STAGE_ACCENT, PRIORITY_ACCENT } from "./presets.constants"
import { fadeUp, cardHoverY, quickTransition, dragVariant, idleVariant } from "@/lib/animations"
import type { AccentColor, Lead } from "./types"

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
    <motion.div
      onClick={() => onClick?.(lead.id)}
      className={cn(
        "relative p-3 rounded-xl border border-white/[0.08] backdrop-blur-md cursor-pointer",
        "hover:border-white/[0.16]",
      )}
      style={{ borderLeft: `3px solid ${tok.solid}`, background: "var(--surface-glass)", ...selectionRing(tok, selected) }}
      variants={fadeUp}
      animate={dragging ? dragVariant : idleVariant}
      whileHover={cardHoverY}
      transition={quickTransition}
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
    </motion.div>
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
    <motion.div
      onClick={() => onClick?.(lead.id)}
      className={cn(
        "relative group p-3 rounded-xl border border-white/[0.08] backdrop-blur-md cursor-pointer",
        "hover:border-white/[0.16]",
      )}
      style={{
        background: "var(--surface-glass)",
        borderLeft: `3px solid ${tok.solid}`,
        boxShadow:
          selected && dragging
            ? `0 0 0 1px ${tok.solid}, 0 0 24px -4px ${tok.glow}`
            : selected
            ? `0 0 0 1px ${tok.solid}`
            : dragging
            ? `0 0 24px -4px ${tok.glow}`
            : undefined,
      }}
      variants={fadeUp}
      animate={dragging ? dragVariant : idleVariant}
      whileHover={cardHoverY}
      transition={quickTransition}
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
    </motion.div>
  )
}

function ScoredVariant(props: LeadCardProps) {
  const { lead, selected, onClick, onAction } = props
  const priority = lead.priority ?? "medium"
  const accentName: AccentColor = PRIORITY_ACCENT[priority]
  const tok = accentToken(accentName)
  return (
    <motion.div
      onClick={() => onClick?.(lead.id)}
      className={cn(
        "p-4 rounded-xl border backdrop-blur-md cursor-pointer",
        "hover:border-white/[0.16]"
      )}
      style={{ borderColor: tok.border, background: "var(--surface-glass)", ...selectionRing(tok, selected) }}
      variants={fadeUp}
      whileHover={cardHoverY}
      transition={quickTransition}
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
          <div className="text-xs flex-1" style={{ color: accentToken("amber").fg }}>
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
    </motion.div>
  )
}

function CompactVariant(props: LeadCardProps) {
  const { lead, selected, onClick } = props
  const accentName = resolveAccent(props)
  const tok = accentToken(accentName)
  return (
    <motion.div
      onClick={() => onClick?.(lead.id)}
      className={cn(
        "min-h-9 p-2 rounded-lg border border-white/[0.08] text-xs flex items-center gap-2 cursor-pointer",
        "hover:bg-white/[0.04]"
      )}
      style={selectionRing(tok, selected)}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.1 }}
      title={lead.address}
    >
      <span className="truncate font-semibold">{lead.address}</span>
      <span className="text-muted-foreground truncate">· {lead.owner_name ?? "—"}</span>
      <span className="ml-auto font-mono tabular-nums shrink-0">{fmtPrice(lead.ask_price)}</span>
    </motion.div>
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
