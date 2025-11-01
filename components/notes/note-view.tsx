'use client'

import { useState, useEffect, useRef } from 'react'
import { Note, Folder } from '@/types'
import { Editor } from '@/components/notes/editor'
import { ChevronRight, Calendar, Tag, MoreHorizontal, Trash2, FolderIcon } from 'lucide-react'
import { formatDistanceToNow } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface NoteViewProps {
  note: Note
  folders: Folder[]
  onUpdate: (noteId: string, data: { title?: string; content?: string; folder_id?: string | null; tags?: string }) => Promise<void>
  onDelete: (noteId: string) => void
  searchHighlight?: string | null
}

export function NoteView({ note, folders, onUpdate, onDelete, searchHighlight }: NoteViewProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Update local state when note prop changes
  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
  }, [note.id, note.title, note.content])

  // Highlight and scroll to search term
  useEffect(() => {
    if (!searchHighlight) return

    let attempts = 0
    const maxAttempts = 20

    const highlightText = () => {
      attempts++
      const proseMirror = document.querySelector('.ProseMirror')
      
      if (!proseMirror) {
        if (attempts < maxAttempts) {
          setTimeout(highlightText, 200)
        }
        return
      }

      // Wait a bit more to ensure content is rendered
      setTimeout(() => {
        const pmElement = document.querySelector('.ProseMirror')
        if (!pmElement) return

        // Remove any existing highlights
        pmElement.querySelectorAll('.search-highlight-wrapper').forEach(wrapper => {
          const parent = wrapper.parentNode
          if (parent) {
            const text = wrapper.textContent || ''
            parent.replaceChild(document.createTextNode(text), wrapper)
          }
        })

        // Normalize the DOM
        pmElement.normalize()

        // Escape special regex characters
        const escapedSearch = searchHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`(${escapedSearch})`, 'gi')
        let firstMatch: Element | null = null
        let matchCount = 0

        // Helper to process text nodes
        const highlightInNode = (node: Node): void => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || ''
            if (regex.test(text)) {
              regex.lastIndex = 0
              const fragment = document.createDocumentFragment()
              let lastIndex = 0
              let match: RegExpExecArray | null

              while ((match = regex.exec(text)) !== null) {
                // Add text before match
                if (match.index > lastIndex) {
                  fragment.appendChild(
                    document.createTextNode(text.slice(lastIndex, match.index))
                  )
                }

                // Add highlighted match
                const mark = document.createElement('mark')
                mark.className = 'search-highlight bg-yellow-400 text-black px-1 py-0.5 rounded font-semibold'
                mark.textContent = match[0]
                
                const wrapper = document.createElement('span')
                wrapper.className = 'search-highlight-wrapper'
                wrapper.appendChild(mark)
                fragment.appendChild(wrapper)

                if (!firstMatch) {
                  firstMatch = mark
                }
                matchCount++

                lastIndex = regex.lastIndex
              }

              // Add remaining text
              if (lastIndex < text.length) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex)))
              }

              // Replace the text node with the fragment
              node.parentNode?.replaceChild(fragment, node)
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element
            // Skip already highlighted content and skip processing mark elements
            if (!element.classList.contains('search-highlight-wrapper') && 
                element.tagName !== 'MARK') {
              // Process child nodes (convert to array to avoid live NodeList issues)
              Array.from(node.childNodes).forEach(child => highlightInNode(child))
            }
          }
        }

        // Start processing
        Array.from(pmElement.childNodes).forEach(child => highlightInNode(child))

        // Scroll to first match
        if (firstMatch) {
          setTimeout(() => {
            firstMatch?.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            })
          }, 300)
        }
      }, 300)
    }

    // Start the highlighting process
    highlightText()

    // Cleanup function
    return () => {
      const proseMirror = document.querySelector('.ProseMirror')
      if (proseMirror) {
        proseMirror.querySelectorAll('.search-highlight-wrapper').forEach(wrapper => {
          const parent = wrapper.parentNode
          if (parent) {
            const text = wrapper.textContent || ''
            parent.replaceChild(document.createTextNode(text), wrapper)
          }
        })
        proseMirror.normalize()
      }
    }
  }, [searchHighlight, note.id])

  const handleTitleBlur = async () => {
    setIsEditingTitle(false)
    if (title.trim() !== note.title && title.trim()) {
      setIsSaving(true)
      await onUpdate(note.id, { title: title.trim() })
      setIsSaving(false)
    } else {
      setTitle(note.title)
    }
  }

  const handleContentChange = async (newContent: string) => {
    // Only called when Ctrl+S is pressed in the Editor
    setIsSaving(true)
    await onUpdate(note.id, { content: newContent })
    setIsSaving(false)
  }

  const folder = folders.find(f => f.id === note.folder_id)

  return (
    <div className="flex-1 bg-black h-screen overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          <span>Cortex</span>
          <ChevronRight className="h-4 w-4" />
          {folder && (
            <>
              <div className="flex items-center gap-1.5">
                {folder.emoji ? (
                  <span className="text-xs">{folder.emoji}</span>
                ) : (
                  <FolderIcon className="h-3.5 w-3.5" style={{ color: folder.color }} />
                )}
                <span>{folder.name}</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
          <span className="text-zinc-400">{note.title}</span>
        </div>

        {/* Title */}
        {isEditingTitle ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTitleBlur()
              } else if (e.key === 'Escape') {
                setTitle(note.title)
                setIsEditingTitle(false)
              }
            }}
            autoFocus
            className="w-full text-4xl font-bold text-white bg-transparent border-none outline-none mb-2"
          />
        ) : (
          <h1
            onClick={() => setIsEditingTitle(true)}
            className="text-4xl font-bold text-white mb-2 cursor-text hover:bg-zinc-900/50 px-1 -mx-1 rounded transition-colors"
          >
            {title || 'Untitled'}
          </h1>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-4 text-sm text-zinc-500 mb-8 pb-8 border-b border-zinc-900">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>Edited {formatDistanceToNow(note.updated_at)}</span>
          </div>
          
          {note.tags && note.tags.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Tag className="h-4 w-4" />
              <div className="flex gap-1.5">
                {note.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-zinc-900 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isSaving && (
            <span className="text-blue-400 text-xs flex items-center gap-1">
              <span className="animate-pulse">●</span> Saving...
            </span>
          )}

          <div className="flex-1" />

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(note.id)}
            className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>

        {/* Editor */}
        <div className="notion-editor relative">
          <Editor
            content={content}
            onChange={handleContentChange}
            placeholder="Type @ for commands, or just start writing... (Press Ctrl+S to save)"
          />
          
          {/* Helper hint */}
          <div className="mt-8 pt-8 border-t border-zinc-900">
            <div className="flex items-center gap-6 text-xs text-zinc-600">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-500">Ctrl+S</kbd>
                <span className="text-blue-400 font-medium">Save note</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-500">@</kbd>
                <span>Open command menu</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-500">↑</kbd>
                <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-500">↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-500">Enter</kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-500">Esc</kbd>
                <span>Close</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

