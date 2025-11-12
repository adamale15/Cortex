'use client'

import { PropsWithChildren, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAIPanelStore } from '@/store/use-ai-panel-store'
import { AI_PANEL_WIDTH } from '@/components/ai/ai-panel'

const GUTTER = 32 // extra breathing room between content and panel

function useIsDesktop(breakpoint: string = '(min-width: 1024px)') {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(breakpoint)
    const handler = (event: MediaQueryListEvent | MediaQueryList) => {
      setMatches(event.matches)
    }
    handler(mql)
    if (mql.addEventListener) {
      mql.addEventListener('change', handler as (event: MediaQueryListEvent) => void)
      return () => mql.removeEventListener('change', handler as (event: MediaQueryListEvent) => void)
    }
    mql.addListener(handler as (event: MediaQueryListEvent) => void)
    return () => mql.removeListener(handler as (event: MediaQueryListEvent) => void)
  }, [breakpoint])

  return matches
}

export function AIWorkspaceShift({ children }: PropsWithChildren) {
  const isPanelOpen = useAIPanelStore((state) => state.isOpen)
  const isDesktop = useIsDesktop()

  const paddingRight =
    isPanelOpen && isDesktop ? AI_PANEL_WIDTH + GUTTER : 0

  return (
    <motion.div
      className="min-h-screen transition-colors duration-300"
      animate={{ paddingRight }}
      transition={{ type: 'spring', stiffness: 220, damping: 28 }}
    >
      {children}
    </motion.div>
  )
}


