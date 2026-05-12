import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { accent as accentToken } from "./tokens"
import type { AccentColor } from "./types"

type SpinnerSize = "xs" | "sm" | "md" | "lg"

type SpinnerProps = {
  size?: SpinnerSize
  accent?: AccentColor
  label?: string
  className?: string
}

const SIZE_PX: Record<SpinnerSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
}

export function Spinner({ size = "sm", accent, label, className }: SpinnerProps) {
  const pxSize = SIZE_PX[size]
  // Default: inherit currentColor from parent context (button text, body, etc.)
  // accent="neutral" -> explicit muted; accent="green" etc. -> explicit override
  const colorStyle: React.CSSProperties | undefined =
    accent === undefined
      ? undefined
      : accent === "neutral"
      ? { color: "var(--muted-foreground)" }
      : { color: accentToken(accent).fg }

  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      style={colorStyle}
      role="status"
    >
      <Loader2 size={pxSize} className="motion-safe:animate-spin" aria-hidden="true" />
      {label ? (
        <span className="text-xs text-muted-foreground">{label}</span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </span>
  )
}
