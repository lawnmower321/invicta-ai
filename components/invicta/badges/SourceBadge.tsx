import { StatBadge, type StatBadgeSize } from "../StatBadge"
import type { AccentColor } from "../types"

const KNOWN_SOURCES: Record<string, AccentColor> = {
  zillow: "blue",
  mls: "purple",
  driving: "amber",
  facebook: "blue",
  skip: "green",
  auction: "red",
}

export function SourceBadge({ source, size }: { source: string; size?: StatBadgeSize }) {
  const key = source.toLowerCase()
  const a: AccentColor = KNOWN_SOURCES[key] ?? "neutral"
  return <StatBadge label={source} accent={a} size={size} />
}
