"use client"

import { motion } from "framer-motion"

// Next.js re-creates this component on every navigation, so wrapping in
// a motion.div produces a fade on each route change without needing to
// track the URL or use AnimatePresence at the layout level.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}
