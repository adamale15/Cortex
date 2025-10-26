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
    
    // Add space between block elements for better text extraction
    const blockElements = tmp.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, blockquote')
    blockElements.forEach(el => {
      el.textContent = (el.textContent || '') + ' '
    })
    
    return tmp.textContent || tmp.innerText || ''
  }

  // Truncate HTML content while preserving formatting
  const getTruncatedContent = (html: string, maxLength: number = 150) => {
    const textContent = getTextContent(html)
    const isTruncated = textContent.trim().length > maxLength
    
    if (!isTruncated) {
      return { html, isTruncated: false }
    }
    
    // Truncate while preserving HTML structure
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    
    let currentLength = 0
    let truncated = false
    
    const truncateNode = (node: Node): boolean => {
      if (truncated) return false
      
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || ''
        if (currentLength + text.length > maxLength) {
          node.textContent = text.slice(0, maxLength - currentLength)
          truncated = true
          return false
        }
        currentLength += text.length
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const children = Array.from(node.childNodes)
        for (const child of children) {
          if (!truncateNode(child)) {
            // Remove remaining siblings
            let next = child.nextSibling
            while (next) {
              const toRemove = next
              next = next.nextSibling
              node.removeChild(toRemove)
            }
            return false
          }
        }
      }
      return true
    }
    
    truncateNode(tmp)
    
    return { html: tmp.innerHTML, isTruncated: true }
  }

  const hasContent = note.content && getTextContent(note.content).trim().length > 0
  const { html: contentHtml, isTruncated } = getTruncatedContent(note.content || '', 150)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors group h-full flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-base font-semibold text-white line-clamp-1 flex-1">
          {note.title}
        </h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(note)}
            className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-zinc-800"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(note.id)}
            className="h-7 w-7 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {hasContent && (
        <div className="text-gray-400 text-xs mb-2 line-clamp-2 prose prose-invert prose-sm max-w-none [&_strong]:text-gray-300 [&_em]:text-gray-300 [&_u]:text-gray-300 flex-1">
          <span dangerouslySetInnerHTML={{ __html: contentHtml }} />
          {isTruncated && '...'}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto gap-2">
        <div className="flex flex-wrap gap-1">
          {note.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-xs px-1.5 py-0.5 bg-zinc-800 text-gray-300 rounded"
            >
              {tag}
            </span>
          ))}
          {note.tags && note.tags.length > 2 && (
            <span className="text-xs px-1.5 py-0.5 text-gray-500">
              +{note.tags.length - 2}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {formatDistanceToNow(note.updated_at)}
        </span>
      </div>
    </div>
  )
}

