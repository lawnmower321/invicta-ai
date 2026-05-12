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
