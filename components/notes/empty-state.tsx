'use client'

import { FileText, FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  hasNotes: boolean
  onNewNote: () => void
  onNewFolder: () => void
}

export function EmptyState({ hasNotes, onNewNote, onNewFolder }: EmptyStateProps) {
  return (
    <div className="flex-1 bg-black h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <FileText className="h-16 w-16 text-zinc-800 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            {hasNotes ? 'Select a note' : 'Start taking notes'}
          </h2>
          <p className="text-zinc-500">
            {hasNotes 
              ? 'Choose a note from the sidebar to view and edit it'
              : 'Create your first note or organize with folders'
            }
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={onNewNote}
            className="bg-white hover:bg-zinc-200 text-black"
          >
            <FileText className="h-4 w-4 mr-2" />
            New Note
          </Button>
          <Button
            onClick={onNewFolder}
            variant="outline"
            className="bg-transparent border-zinc-700 text-white hover:bg-zinc-900"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        </div>
      </div>
    </div>
  )
}

