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
