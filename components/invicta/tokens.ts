import type { AccentColor } from './types'

export type AccentTokens = {
  solid: string   // e.g. 'var(--invicta-green)' or 'var(--muted-foreground)'
  soft: string    // 12% opacity background tint
  border: string  // 30% opacity border
  glow: string    // 18% opacity glow/inset
  fg: string      // foreground color, same as solid
}

// Raw RGB triplets — must match the hex values in app/globals.css :root
const ACCENT_RGB: Record<AccentColor, string> = {
  green: '0 230 118',     // #00e676
  blue: '68 138 255',     // #448aff
  purple: '224 64 251',   // #e040fb
  amber: '255 171 64',    // #ffab40
  red: '255 82 82',       // #ff5252
  neutral: '107 107 138', // matches --muted-foreground (#6b6b8a)
}

export function accent(color: AccentColor): AccentTokens {
  const rgb = ACCENT_RGB[color]
  const solid = color === 'neutral' ? 'var(--muted-foreground)' : `var(--invicta-${color})`
  return {
    solid,
    soft: `rgb(${rgb} / 0.12)`,
    border: `rgb(${rgb} / 0.30)`,
    glow: `rgb(${rgb} / 0.18)`,
    fg: solid,
  }
}
