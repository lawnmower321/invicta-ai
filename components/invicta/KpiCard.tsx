import Link from "next/link"
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { accent as accentToken } from "./tokens"
import type { AccentColor } from "./types"

type KpiCardFormat = "currency" | "number" | "percent" | "raw"

type KpiCardProps = {
  label: string
  value: string | number
  format?: KpiCardFormat
  icon?: LucideIcon
  accent?: AccentColor
  trend?: { dir: "up" | "down" | "flat"; value: string }
  hint?: string
  variant?: "default" | "feature"
  loading?: boolean
  href?: string
}

function formatValue(value: string | number, format: KpiCardFormat): string {
  if (typeof value === "string") return value
  switch (format) {
    case "currency":
      return `$${value.toLocaleString()}`
    case "percent":
      return `${value}%`
    case "number":
      return value.toLocaleString()
    case "raw":
    default:
      return String(value)
  }
}

export function KpiCard({
  label,
  value,
  format = "raw",
  icon: Icon,
  accent: accentName = "neutral",
  trend,
  hint,
  variant = "default",
  loading,
  href,
}: KpiCardProps) {
  const tok = accentToken(accentName)
  const isFeature = variant === "feature"

  const cardClasses = cn(
    "block w-full h-full border transition-all duration-150 ease-out",
    isFeature ? "p-5 rounded-2xl" : "p-4 rounded-xl border-white/[0.08]",
    href && "hover:-translate-y-px hover:border-white/[0.16] cursor-pointer"
  )

  const cardStyle: React.CSSProperties = isFeature
    ? {
        borderColor: tok.border,
        backgroundColor: tok.soft,
        boxShadow: `inset 0 0 0 1px ${tok.border}, 0 0 24px -8px ${tok.glow}`,
      }
    : {}

  const trendColor =
    !trend
      ? undefined
      : trend.dir === "up"
      ? "var(--invicta-green)"
      : trend.dir === "down"
      ? "var(--invicta-red)"
      : "var(--muted-foreground)"
  const TrendIcon: LucideIcon | null = !trend
    ? null
    : trend.dir === "up"
    ? TrendingUp
    : trend.dir === "down"
    ? TrendingDown
    : Minus

  const content = (
    <>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
        {Icon && <Icon size={14} style={{ color: tok.fg }} aria-hidden="true" />}
      </div>
      {loading ? (
        <div
          className={cn(
            "rounded-md motion-safe:animate-pulse bg-white/[0.06]",
            isFeature ? "h-10" : "h-8"
          )}
          aria-label="Loading"
        />
      ) : (
        <div className={cn("font-mono tabular-nums font-bold leading-none", isFeature ? "text-4xl" : "text-3xl")}>
          {formatValue(value, format)}
        </div>
      )}
      {trend && !loading && (
        <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: trendColor }}>
          {TrendIcon && <TrendIcon size={12} aria-hidden="true" />}
          <span>{trend.value}</span>
        </div>
      )}
      {hint && !loading && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </>
  )

  if (href) {
    return (
      <Link href={href} className={cardClasses} style={cardStyle}>
        {content}
      </Link>
    )
  }
  return (
    <div className={cardClasses} style={cardStyle}>
      {content}
    </div>
  )
}

type KpiGridProps = {
  cols?: 2 | 3 | 4
  children: React.ReactNode
}

const COLS: Record<NonNullable<KpiGridProps["cols"]>, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
}

export function KpiGrid({ cols = 4, children }: KpiGridProps) {
  return <div className={cn("grid grid-cols-2 gap-3 auto-rows-fr", COLS[cols])}>{children}</div>
}
