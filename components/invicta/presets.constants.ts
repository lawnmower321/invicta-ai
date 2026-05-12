// Business-logic thresholds extracted from UI components.
// When the AI scoring model retunes or pricing semantics shift,
// edit here — no component code changes required.

import type { AccentColor, PipelineStage } from "./types"

export const SCORE_THRESHOLDS = {
  high: 8,    // score >= 8 -> green accent
  medium: 5,  // score >= 5 -> amber accent (else red)
} as const

export const SPREAD_NEUTRAL_RANGE = 0 as const  // exactly 0 is neutral; >0 green, <0 red

// Stage → accent mapping. Single source of truth; consumed by StageBadge,
// LeadCard (pool/kanban accent), and EmptyPipeline.
export const STAGE_ACCENT: Record<PipelineStage, AccentColor> = {
  new: "blue",
  contacted: "amber",
  qualified: "purple",
  offer: "green",
  contract: "green",
  closed: "red",
}

// Priority → accent mapping. Consumed by PriorityBadge and LeadCard (scored variant).
export type Priority = "high" | "medium" | "low"
export const PRIORITY_ACCENT: Record<Priority, AccentColor> = {
  high: "red",
  medium: "amber",
  low: "neutral",
}
