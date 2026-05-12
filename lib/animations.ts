import type { Variants, Transition } from "framer-motion"

// Entrance: fade + subtle upward translate. 200-300ms ease-out per CLAUDE.md.
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" } as Transition,
  },
}

// Container variant that staggers direct children using the fadeUp variant.
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 } as Transition,
  },
}

// Same stagger but faster for dense lists (lead cards, scored results).
export const staggerContainerFast: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 } as Transition,
  },
}

// Standard card hover lift — replaces CSS hover:-translate-y-px
export const cardHoverY = { y: -2 } as const

// Drag state for kanban/pool cards — smooth opacity + scale via animate prop
export const dragVariant = { opacity: 0.45, scale: 1.03 } as const
export const idleVariant = { opacity: 1, scale: 1 } as const

// Transition shared across interactive elements
export const quickTransition: Transition = { duration: 0.15, ease: "easeOut" }
