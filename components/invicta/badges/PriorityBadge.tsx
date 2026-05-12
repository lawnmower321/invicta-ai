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
