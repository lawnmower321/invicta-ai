import { Layers } from "lucide-react"
import { EmptyState } from "../EmptyState"
import { STAGE_ACCENT } from "../presets.constants"
import type { PipelineStage } from "../types"

export function EmptyPipeline({ stage }: { stage: PipelineStage }) {
  return <EmptyState icon={Layers} title="Drop here" size="sm" accent={STAGE_ACCENT[stage]} />
}
