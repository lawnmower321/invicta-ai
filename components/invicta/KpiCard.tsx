"use client"

import Link from "next/link"
import { useEffect } from "react"
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react"
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion"
import { cn } from "@/lib/utils"
import { accent as accentToken } from "./tokens"
import { fadeUp, staggerContainer, cardHoverY, quickTransition } from "@/lib/animations"
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
    case "currency": return `$${value.toLocaleString()}`
    case "percent":  return `${value}%`
    case "number":   return value.toLocaleString()
    case "raw":
    default:         return String(value)
  }
}

// Count-up for numeric KPI values — animates from 0 to the target on mount/change.
function CountUp({ value, format }: { value: number; format: KpiCardFormat }) {
  const motionValue = useMotionValue(0)
  const display = useTransform(motionValue, v => formatValue(Math.round(v), format))

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.7, ease: "easeOut" })
    return controls.stop
  }, [value, motionValue])

  return <motion.span>{display}</motion.span>
}

const MotionLink = motion(Link)

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

  // CSS hover:border is kept; translate is handled by whileHover below.
  const cardClasses = cn(
    "block w-full h-full border backdrop-blur-md",
    isFeature ? "p-5 rounded-2xl" : "p-4 rounded-xl border-white/[0.08]",
    href && "hover:border-white/[0.16] cursor-pointer"
  )

  const cardStyle: React.CSSProperties = isFeature
    ? {
        borderColor: tok.border,
        backgroundColor: tok.soft,
        boxShadow: `inset 0 0 0 1px ${tok.border}, 0 0 24px -8px ${tok.glow}`,
      }
    : { background: "var(--surface-glass)" }

  const trendColor =
    !trend ? undefined
    : trend.dir === "up"   ? "var(--invicta-green)"
    : trend.dir === "down" ? "var(--invicta-red)"
    : "var(--muted-foreground)"
  const TrendIcon: LucideIcon | null =
    !trend ? null
    : trend.dir === "up"   ? TrendingUp
    : trend.dir === "down" ? TrendingDown
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
        <div className={cn(
          "font-mono tabular-nums font-bold leading-none",
          isFeature ? "text-4xl" : "text-3xl"
        )}>
          {typeof value === "number"
            ? <CountUp value={value} format={format} />
            : formatValue(value, format)
          }
        </div>
      )}
      {trend && !loading && (
        <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: trendColor }}>
          {TrendIcon && <TrendIcon size={12} aria-hidden="true" />}
          <span>{trend.value}</span>
        </div>
      )}
      {hint && !loading && (
        <div className="text-xs text-muted-foreground mt-1">{hint}</div>
      )}
    </>
  )

  const motionProps = {
    variants: fadeUp,
    whileHover: cardHoverY,
    transition: quickTransition,
  }

  if (href) {
    return (
      <MotionLink href={href} className={cardClasses} style={cardStyle} {...motionProps}>
        {content}
      </MotionLink>
    )
  }
  return (
    <motion.div className={cardClasses} style={cardStyle} {...motionProps}>
      {content}
    </motion.div>
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

// KpiGrid is the stagger container — children (KpiCards) inherit the fadeUp variant.
export function KpiGrid({ cols = 4, children }: KpiGridProps) {
  return (
    <motion.div
      className={cn("grid grid-cols-2 gap-3 auto-rows-fr", COLS[cols])}
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  )
}
