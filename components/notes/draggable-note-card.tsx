'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Note } from '@/types'
import { NoteCard } from './note-card'
import { GripVertical } from 'lucide-react'

interface DraggableNoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
}

export function DraggableNoteCard({ note, onEdit, onDelete }: DraggableNoteCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group h-full">
      <div className={`${isDragging ? 'opacity-50 scale-105' : 'opacity-100'} transition-all h-full pt-3`}>
        {/* Drag Handle - Positioned at top center, only visible on hover */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-0 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-20"
        >
          <div className="bg-zinc-800 rounded-full p-1 hover:bg-zinc-700 transition-colors shadow-lg border border-zinc-700">
            <GripVertical className="h-3 w-3 text-gray-400" />
          </div>
        </div>

        {/* Note Card */}
        <NoteCard note={note} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  )
}

