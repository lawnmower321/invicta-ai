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
