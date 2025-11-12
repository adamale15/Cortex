'use client'

import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAIPanelStore } from '@/store/use-ai-panel-store'

export function ActivateAIButton() {
  const openPanel = useAIPanelStore((state) => state.openPanel)

  return (
    <Button
      type="button"
      onClick={openPanel}
      title="Activate Cortex AI"
      className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 text-white border border-indigo-500/60 shadow-[0_0_25px_rgba(79,70,229,0.35)] hover:from-indigo-500 hover:to-cyan-400 transition-transform active:scale-95"
    >
      <Sparkles className="h-5 w-5" />
    </Button>
  )
}


