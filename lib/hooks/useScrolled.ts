"use client"

import { useEffect, useState } from "react"

/**
 * Returns true when window.scrollY exceeds the threshold (default 8px).
 * Passive listener, cleans up on unmount. Used by PageShell for the
 * sticky-header backdrop-blur trigger and any future sticky surfaces.
 */
export function useScrolled(threshold: number = 8): boolean {
  const [scrolled, setScrolled] = useState<boolean>(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()  // sync initial state in case the page loads scrolled
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [threshold])

  return scrolled
}
