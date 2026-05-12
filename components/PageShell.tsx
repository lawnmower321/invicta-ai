"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useScrolled } from "@/lib/hooks/useScrolled"
import { accent as accentToken } from "@/components/invicta/tokens"
import type { AccentColor } from "@/components/invicta/types"

type Props = {
  title: string
  eyebrow?: string
  subtitle?: string
  back?: boolean
  action?: React.ReactNode
  accent?: AccentColor
  subBar?: React.ReactNode
  children: React.ReactNode
}

export default function PageShell({
  title,
  eyebrow,
  subtitle,
  back,
  action,
  accent: accentName,
  subBar,
  children,
}: Props) {
  const router = useRouter()
  const scrolled = useScrolled(8)

  // Default --page-accent is neutral per spec §3.5. Pages opt into a dominant
  // accent color by passing the `accent` prop; nested SectionHeader/EmptyState
  // then inherit it. Spinner is the one exception that never inherits.
  const pageAccentVar = accentToken(accentName ?? "neutral").solid
  // Mobile header height: h-12 when no eyebrow, h-14 when eyebrow is present. Desktop is h-14 either way.
  const headerHeightMobile = eyebrow ? "h-14" : "h-12"

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={
        {
          background: "var(--background)",
          "--page-accent": pageAccentVar,
        } as React.CSSProperties
      }
    >
      {/* Ambient glow layer — reacts to --page-accent; sits below all content */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-48 -left-24 w-[600px] h-[600px] rounded-full blur-[140px]"
          style={{ background: "var(--page-accent)", opacity: 0.08 }}
        />
        <div
          className="absolute -bottom-48 -right-24 w-[400px] h-[400px] rounded-full blur-[120px]"
          style={{ background: "var(--page-accent)", opacity: 0.05 }}
        />
      </div>

      <div
        className={cn(
          "relative z-30 sticky top-[52px] md:top-0 border-b transition-colors duration-150 px-5 md:px-8",
          scrolled ? "bg-background/80 backdrop-blur-md" : "bg-background"
        )}
        style={{ borderColor: "rgb(255 255 255 / 0.06)" }}
      >
        <div className={cn("flex items-center justify-between", headerHeightMobile, "md:h-14")}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {back && (
              <button
                onClick={() => router.back()}
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-opacity hover:opacity-60"
                style={{ background: "var(--surface-2)" }}
                aria-label="Go back"
              >
                <ArrowLeft size={15} />
              </button>
            )}
            <div className="min-w-0">
              {eyebrow && (
                <div className="text-[10px] tracking-[0.18em] opacity-60 uppercase font-bold mb-0.5">
                  {eyebrow}
                </div>
              )}
              <h1 className="font-bold text-xl md:text-2xl tracking-tight leading-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p
                  className="text-xs mt-0.5 truncate"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && (
            <div className="shrink-0 ml-3 max-w-[50%] md:max-w-none flex items-center gap-2">
              {action}
            </div>
          )}
        </div>
        {subBar && (
          <div
            className="border-t flex items-center h-10"
            style={{ borderColor: "rgb(255 255 255 / 0.06)" }}
          >
            {subBar}
          </div>
        )}
      </div>

      <div className="relative z-10 px-5 md:px-8 py-5 w-full">{children}</div>
    </div>
  )
}
