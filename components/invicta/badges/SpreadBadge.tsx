import { StatBadge, type StatBadgeSize } from "../StatBadge"
import { SPREAD_NEUTRAL_RANGE } from "../presets.constants"
import type { AccentColor } from "../types"

function formatSpread(value: number): string {
  const abs = Math.abs(value)
  const sign = value > 0 ? "+" : value < 0 ? "-" : ""
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(0)}k`
  return `${sign}$${abs.toLocaleString()}`
}

export function SpreadBadge({ value, size }: { value: number; size?: StatBadgeSize }) {
  const a: AccentColor =
    value === SPREAD_NEUTRAL_RANGE ? "neutral" : value > SPREAD_NEUTRAL_RANGE ? "green" : "red"
  return <StatBadge label={formatSpread(value)} accent={a} size={size} />
}
