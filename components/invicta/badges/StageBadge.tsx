import { StatBadge, type StatBadgeSize } from "../StatBadge"
import { STAGE_ACCENT } from "../presets.constants"
import type { PipelineStage } from "../types"

const STAGE_LABELS: Record<PipelineStage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  offer: "Offer",
  contract: "Contract",
  closed: "Closed",
}

export function StageBadge({ stage, size }: { stage: PipelineStage; size?: StatBadgeSize }) {
  return <StatBadge label={STAGE_LABELS[stage]} accent={STAGE_ACCENT[stage]} size={size} />
}
