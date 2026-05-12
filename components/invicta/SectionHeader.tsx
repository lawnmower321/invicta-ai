"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { accent as accentToken } from "./tokens"
import type { AccentColor } from "./types"

type SectionHeaderProps = {
  title: string
  eyebrow?: string
  hint?: string
  count?: number
  accent?: AccentColor
  action?: React.ReactNode
  divider?: boolean
  size?: "sm" | "md"
}

export function SectionHeader({
  title,
  eyebrow,
  hint,
  count,
  accent: accentProp,
  action,
  divider,
  size = "md",
}: SectionHeaderProps) {
  const inherit = accentProp === undefined
  const tok = inherit ? null : accentToken(accentProp)

  const accentFg = inherit ? "var(--page-accent, var(--muted-foreground))" : tok!.fg
  const accentBorderColor = inherit
    ? "var(--page-accent, rgb(255 255 255 / 0.30))"
    : tok!.border

  const useGradientDivider = !inherit && accentProp !== "neutral"

  const isMd = size === "md"
  const showDivider = divider ?? isMd

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex items-end justify-between gap-3",
        showDivider && "pb-2 mb-3 border-b",
        showDivider && !useGradientDivider && "border-white/[0.06]"
      )}
      style={
        showDivider && useGradientDivider
          ? {
              borderImageSlice: 1,
              borderImageSource: `linear-gradient(to right, ${accentBorderColor}, transparent)`,
            }
          : undefined
      }
    >
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <div className="text-[9px] tracking-[0.18em] opacity-60 uppercase font-bold mb-0.5">
            {eyebrow}
          </div>
        )}
        <div className="flex items-center gap-2 min-w-0">
          <h2
            className={cn(
              "font-bold uppercase truncate text-muted-foreground",
              isMd ? "text-[11px] tracking-[0.14em]" : "text-[10px] tracking-[0.12em]"
            )}
          >
            {title}
          </h2>
          {count !== undefined && isMd && (
            <>
              <span className="border-l border-white/[0.08] h-3 inline-block" aria-hidden="true" />
              <span
                className="text-[10px] font-bold tabular-nums uppercase"
                style={{ color: accentFg }}
              >
                {count}
              </span>
            </>
          )}
          {hint && (
            <span className="text-xs text-muted-foreground truncate">{hint}</span>
          )}
        </div>
      </div>
      {action && (
        <div className="shrink-0 max-w-[50%] md:max-w-none flex items-center gap-2">
          {action}
        </div>
      )}
    </motion.div>
  )
}
