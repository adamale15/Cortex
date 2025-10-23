'use client'

import { Note } from '@/types'
import { formatDistanceToNow } from '@/lib/utils'
import { Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
}

export function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  // Get text content length for preview limiting
  const getTextContent = (html: string) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  // Truncate HTML content while preserving formatting
  const getTruncatedContent = (html: string, maxLength: number = 150) => {
    const textContent = getTextContent(html)
    const isTruncated = textContent.length > maxLength
    
    if (!isTruncated) {
      return { html, isTruncated: false }
    }
    
    // Create a temporary div to truncate
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    const text = tmp.textContent || ''
    
    if (text.length > maxLength) {
      // Strip HTML and truncate for safety
      return { html: text.slice(0, maxLength), isTruncated: true }
    }
    return { html, isTruncated: false }
  }

  const hasContent = note.content && getTextContent(note.content).trim().length > 0
  const { html: contentHtml, isTruncated } = getTruncatedContent(note.content || '', 150)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-white line-clamp-1 flex-1">
          {note.title}
        </h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(note)}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-zinc-800"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(note.id)}
            className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {hasContent && (
        <div className="text-gray-400 text-sm mb-3 line-clamp-3 prose prose-invert prose-sm max-w-none [&_strong]:text-gray-300 [&_em]:text-gray-300 [&_u]:text-gray-300">
          <span dangerouslySetInnerHTML={{ __html: contentHtml }} />
          {isTruncated && '...'}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {note.tags?.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-zinc-800 text-gray-300 rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="text-xs text-gray-500">
          {formatDistanceToNow(note.updated_at)}
        </span>
      </div>
    </div>
  )
}

