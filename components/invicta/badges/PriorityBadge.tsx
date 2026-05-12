import { StatBadge, type StatBadgeSize } from "../StatBadge"
import { PRIORITY_ACCENT, type Priority } from "../presets.constants"

export function PriorityBadge({ priority, size }: { priority: Priority; size?: StatBadgeSize }) {
  return <StatBadge label={priority} accent={PRIORITY_ACCENT[priority]} size={size} />
}
