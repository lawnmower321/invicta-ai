import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { accent as accentToken } from "./tokens"
import type { AccentColor } from "./types"

export type StatBadgeSize = "xs" | "sm" | "md"

type StatBadgeProps = {
  label: string
  accent?: AccentColor
  size?: StatBadgeSize
  icon?: LucideIcon
  variant?: "soft" | "outline" | "solid"
  pulse?: boolean
}

const SIZE_CLASSES: Record<StatBadgeSize, string> = {
  xs: "text-[10px] px-1.5 py-0.5 rounded-md",
  sm: "text-[11px] px-2 py-1 rounded-md",
  md: "text-xs px-2.5 py-1.5 rounded-lg",
}

const ICON_PX: Record<StatBadgeSize, number> = { xs: 10, sm: 12, md: 14 }
const DOT_SIZE: Record<StatBadgeSize, string> = { xs: "w-1 h-1", sm: "w-1.5 h-1.5", md: "w-1.5 h-1.5" }

export function StatBadge({
  label,
  accent: accentName = "neutral",
  size = "sm",
  icon: Icon,
  variant = "soft",
  pulse = false,
}: StatBadgeProps) {
  const tok = accentToken(accentName)
  const style: React.CSSProperties =
    variant === "soft"
      ? { backgroundColor: tok.soft, color: tok.fg }
      : variant === "outline"
      ? { backgroundColor: "transparent", border: `1px solid ${tok.border}`, color: tok.fg }
      : { backgroundColor: tok.solid, color: "var(--background)" }

  return (
    <span
      className={cn(
        "font-bold uppercase tracking-[0.08em] inline-flex items-center gap-1 whitespace-nowrap",
        SIZE_CLASSES[size]
      )}
      style={style}
    >
      {pulse && (
        <span
          className={cn("inline-block rounded-full motion-safe:animate-pulse", DOT_SIZE[size])}
          style={{ backgroundColor: tok.solid }}
          aria-hidden="true"
        />
      )}
      {Icon && <Icon size={ICON_PX[size]} aria-hidden="true" />}
      <span>{label}</span>
    </span>
  )
}
