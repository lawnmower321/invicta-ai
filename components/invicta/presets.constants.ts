// Business-logic thresholds extracted from UI components.
// When the AI scoring model retunes or pricing semantics shift,
// edit here — no component code changes required.

export const SCORE_THRESHOLDS = {
  high: 8,    // score >= 8 -> green accent
  medium: 5,  // score >= 5 -> amber accent (else red)
} as const

export const SPREAD_NEUTRAL_RANGE = 0 as const  // exactly 0 is neutral; >0 green, <0 red
