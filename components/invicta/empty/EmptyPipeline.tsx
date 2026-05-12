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
