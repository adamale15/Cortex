'use client'

import { useState, useEffect, useRef } from 'react'
import { Note, Folder } from '@/types'
import { Editor } from '@/components/notes/editor'
import { ChevronRight, Calendar, Tag, MoreHorizontal, Trash2, FolderIcon, Download } from 'lucide-react'
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
  const [showExport, setShowExport] = useState(false)

  const handleDownloadImage = async () => {
    try {
      const editorEl = document.querySelector('.ProseMirror') as HTMLElement | null
      if (!editorEl) return

      const measure = document.createElement('div')
      measure.style.position = 'fixed'
      measure.style.left = '-10000px'
      measure.style.top = '0'
      measure.style.width = '900px'
      measure.style.padding = '48px'
      measure.style.background = '#ffffff'
      measure.style.color = '#000000'
      measure.style.fontFamily = getComputedStyle(document.body).fontFamily
      measure.style.lineHeight = '1.6'
      measure.className = 'export-root'
      // Include the note title as heading
      measure.innerHTML = `<h1>${(note.title || 'Untitled').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</h1>` + editorEl.innerHTML
      // Remove external images to avoid CORS-tainting the canvas
      measure.querySelectorAll('img').forEach((img) => {
        img.remove()
      })
      document.body.appendChild(measure)

      const width = measure.offsetWidth
      const height = measure.offsetHeight

      const style = `
        <style>
          .export-root { font-size:16px; color:#000; }
          .export-root h1{ font-size:32px; font-weight:700; margin:16px 0; color:#000; }
          .export-root h2{ font-size:26px; font-weight:700; margin:14px 0; color:#000; }
          .export-root h3{ font-size:22px; font-weight:700; margin:12px 0; color:#000; }
          .export-root p{ margin:10px 0; }
          .export-root strong{ font-weight:800; color:#000; }
          .export-root em{ font-style:italic; }
          .export-root u{ text-decoration:underline; }
          .export-root s{ text-decoration:line-through; }
          .export-root ul{ margin:8px 0; padding-left:24px; list-style:disc; }
          .export-root ol{ margin:8px 0; padding-left:24px; list-style:decimal; }
          .export-root li{ margin:4px 0; }
          .export-root blockquote{ border-left:4px solid #ddd; padding-left:12px; color:#222; font-style:italic; }
          .export-root code{ background:#f3f3f3; padding:2px 6px; border-radius:4px; font-family:monospace; font-size:90%; color:#111; }
          .export-root a{ color:#111; text-decoration:underline; }
        </style>
      `

      const svg = `<?xml version="1.0" encoding="UTF-8"?>
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
          <foreignObject x="0" y="0" width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;background:#ffffff;color:#000;">
              ${style}
              <div class="export-root" style="padding:48px;">${measure.innerHTML}</div>
            </div>
          </foreignObject>
        </svg>`

      document.body.removeChild(measure)

      const img = new Image()
      img.crossOrigin = 'anonymous'
      const canvas = document.createElement('canvas')
      const scale = Math.max(2, Math.ceil(window.devicePixelRatio || 1) * 2) // 2-4x upscale for sharpness
      canvas.width = width * scale
      canvas.height = height * scale
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(scale, scale)
      ctx.imageSmoothingEnabled = true
      // @ts-ignore - not all browsers
      ctx.imageSmoothingQuality = 'high'

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0)
          resolve()
        }
        img.onerror = reject
        // Use data URL to avoid blob revocation timing and some browser security issues
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
      })

      const dataUrl = canvas.toDataURL('image/png', 1.0)
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${note.title || 'note'}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setShowExport(false)
    } catch (e) {
      console.error('Download failed', e)
      alert('Download failed. Try removing images from the note and try again.')
    }
  }

  const handleDownloadPDF = () => {
    const editorEl = document.querySelector('.ProseMirror') as HTMLElement | null
    if (!editorEl) return
    const w = window.open('', '_blank')
    if (!w) return
    const titleText = (note.title || 'Untitled').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    const html = `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${titleText}</title>
        <style>
          @page { size: A4; margin: 24mm; }
          html, body { height: 100%; }
          body{background:#fff;color:#000;font-family:${getComputedStyle(document.body).fontFamily};line-height:1.6;}
          .page{width:100%;}
          h1{font-size:32px;font-weight:700;margin:0 0 16px;color:#000}
          h2{font-size:26px;font-weight:700;margin:14px 0;color:#000}
          h3{font-size:22px;font-weight:700;margin:12px 0;color:#000}
          p{margin:10px 0}
          strong{font-weight:800;color:#000}
          em{font-style:italic}
          u{text-decoration:underline}
          s{text-decoration:line-through}
          ul{margin:8px 0;padding-left:24px;list-style:disc}
          ol{margin:8px 0;padding-left:24px;list-style:decimal}
          li{margin:4px 0}
          blockquote{border-left:4px solid #ddd;padding-left:12px;color:#222;font-style:italic}
          code{background:#f3f3f3;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:90%;color:#111}
          a{color:#111;text-decoration:underline}
          @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
          /* Improve print sharpness */
          * {-webkit-print-color-adjust:exact; print-color-adjust:exact}
        </style>
      </head>
      <body>
        <div class="page">
          <h1>${titleText}</h1>
          <div>${editorEl.innerHTML}</div>
        </div>
        <script>window.onload=()=>{window.print(); setTimeout(()=>window.close(), 300)};<\/script>
      </body>
      </html>`
    w.document.open()
    w.document.write(html)
    w.document.close()
    setShowExport(false)
  }

  return (
    <div className="flex-1 h-screen overflow-y-auto p-3">
      <div className="max-w-3xl mx-auto px-10 py-12 bg-zinc-950/60 border border-zinc-900 rounded-2xl backdrop-blur shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-8">
          {folder && (
            <>
              <div className="flex items-center gap-1.5">
                {(folder as any).logo_signed_url || (folder as any).logo_url ? (
                  <img src={(folder as any).logo_signed_url || (folder as any).logo_url} alt="logo" className="h-3.5 w-3.5 rounded-sm object-cover" />
                ) : folder.emoji ? (
                  <span className="text-xs">{folder.emoji}</span>
                ) : (
                  <FolderIcon className="h-3.5 w-3.5 text-zinc-400" />
                )}
                <span>{folder.name}</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
          <span className="text-zinc-400 flex-1 truncate">{note.title}</span>
          <div className="relative ml-auto">
            <button
              onClick={() => setShowExport(!showExport)}
              className="inline-flex rounded-full items-center gap-2 px-2 py-1 rounded-md text-xs bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 relative z-10 pointer-events-auto"
              title="Export"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
            {showExport && (
              <div className="absolute right-0 mt-2 w-40 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl z-20">
                <button onClick={handleDownloadImage} className="w-full text-left px-3 py-2 text-xs text-white hover:bg-zinc-800">Image (PNG)</button>
                <button onClick={handleDownloadPDF} className="w-full text-left px-3 py-2 text-xs text-white hover:bg-zinc-800">PDF</button>
              </div>
            )}
          </div>
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
            className="text-white rounded-full hover:text-red-400 hover:bg-red-500/10"
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

