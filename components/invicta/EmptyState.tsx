import Link from "next/link"
import { ArrowRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { accent as accentToken } from "./tokens"
import type { AccentColor } from "./types"

type EmptyStateAction = {
  label: string
  onClick?: () => void
  href?: string
  icon?: LucideIcon
}

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  accent?: AccentColor
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  size?: "compact" | "sm" | "md" | "lg"
}

const SIZE_PAD: Record<NonNullable<EmptyStateProps["size"]>, string> = {
  compact: "p-4",
  sm: "py-6 px-4",
  md: "py-10 px-6",
  lg: "py-16 px-8",
}

const ICON_BOX_PX: Record<NonNullable<EmptyStateProps["size"]>, number> = {
  compact: 0,
  sm: 40,
  md: 48,
  lg: 64,
}

const ICON_PX: Record<NonNullable<EmptyStateProps["size"]>, number> = {
  compact: 16,
  sm: 20,
  md: 24,
  lg: 32,
}

const TITLE_CLASS: Record<NonNullable<EmptyStateProps["size"]>, string> = {
  compact: "text-sm",
  sm: "text-sm",
  md: "text-sm",
  lg: "text-base",
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  accent: accentProp,
  action,
  secondaryAction,
  size = "md",
}: EmptyStateProps) {
  // Inheritance same rule as SectionHeader.
  const inherit = accentProp === undefined
  const tok = inherit ? null : accentToken(accentProp)

  const iconFg = inherit ? "var(--page-accent, var(--muted-foreground))" : tok!.fg
  // Soft background for the icon box: when inheriting, build a low-opacity tint
  // off var(--page-accent) using the relative-color-syntax fallback to muted.
  const iconBg = inherit
    ? "color-mix(in srgb, var(--page-accent, var(--muted-foreground)) 12%, transparent)"
    : tok!.soft

  const actionBorderColor = inherit
    ? "var(--page-accent, rgb(255 255 255 / 0.30))"
    : tok!.border

  const isCompact = size === "compact"
  const boxPx = ICON_BOX_PX[size]
  const iconPx = ICON_PX[size]

  const renderAction = (a: EmptyStateAction, primary: boolean) => {
    const className = primary
      ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-white/[0.04]"
      : "text-xs hover:underline inline-flex items-center gap-1"
    const style: React.CSSProperties = primary
      ? { color: iconFg, borderColor: actionBorderColor }
      : { color: iconFg }
    const inner = (
      <>
        {a.icon && <a.icon size={primary ? 14 : 12} aria-hidden="true" />}
        <span>{a.label}</span>
        {!primary && <ArrowRight size={12} aria-hidden="true" />}
      </>
    )
    if (a.href) {
      return (
        <Link href={a.href} className={className} style={style}>
          {inner}
        </Link>
      )
    }
    return (
      <button type="button" onClick={a.onClick} className={className} style={style}>
        {inner}
      </button>
    )
  }

  return (
    <div
      className={cn(
        "border border-white/[0.06] border-dashed rounded-xl flex flex-col items-center justify-center text-center",
        SIZE_PAD[size]
      )}
    >
      {isCompact ? (
        <div className="flex items-center gap-2 mb-1">
          <Icon size={iconPx} style={{ color: iconFg }} aria-hidden="true" />
          <h3 className={cn("font-semibold", TITLE_CLASS[size])}>{title}</h3>
        </div>
      ) : (
        <>
          <div
            className="flex items-center justify-center rounded-xl mb-3"
            style={{
              width: boxPx,
              height: boxPx,
              backgroundColor: iconBg,
              color: iconFg,
            }}
            aria-hidden="true"
          >
            <Icon size={iconPx} />
          </div>
          <h3 className={cn("font-semibold mb-1", TITLE_CLASS[size])}>{title}</h3>
        </>
      )}
      {description && !isCompact && (
        <p className="text-xs text-muted-foreground mb-3 max-w-sm">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-2">
          {action && renderAction(action, true)}
          {secondaryAction && renderAction(secondaryAction, false)}
        </div>
      )}
    </div>
  )
}
