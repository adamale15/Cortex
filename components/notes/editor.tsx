'use client'

import { useEffect, useState, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import { CommandMenu } from './command-menu'

interface EditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function Editor({ content, onChange, placeholder = 'Type @ for commands...' }: EditorProps) {
  const [showCommandMenu, setShowCommandMenu] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const commandStartPos = useRef<number | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  // Themed link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const pendingRangeRef = useRef<{ from: number; to: number } | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-400 underline cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      // Don't auto-save on every keystroke - only check for @ commands
      // Check for @ character using getText() which is more reliable
      const { from } = editor.state.selection
      const { $from } = editor.state.selection
      
      // Get text from the start of the current text block to cursor
      const textBefore = $from.parent.textContent.slice(0, $from.parentOffset)
      const lastAtIndex = textBefore.lastIndexOf('@')
      
      if (lastAtIndex !== -1) {
        const queryText = textBefore.slice(lastAtIndex + 1)
        
        // Only show menu if @ is at start of line or after a space
        const charBeforeAt = textBefore[lastAtIndex - 1]
        const isValidTrigger = !charBeforeAt || charBeforeAt === ' ' || charBeforeAt === '\n'
        
        if (isValidTrigger && queryText.length <= 20 && !queryText.includes(' ') && !queryText.includes('\n')) {
          // Calculate absolute position of @ in the document
          const absoluteFrom = from - queryText.length - 1
          
          setCommandQuery(queryText)
          setShowCommandMenu(true)
          commandStartPos.current = absoluteFrom
          
          // Calculate menu position
          const coords = editor.view.coordsAtPos(from)
          const margin = 12
          const assumedMenuWidth = 360
          const wrapperRect = wrapperRef.current?.getBoundingClientRect()
          if (wrapperRect) {
            const maxAbsLeft = wrapperRect.right - assumedMenuWidth - margin
            const minAbsLeft = wrapperRect.left + margin
            const absLeft = Math.max(minAbsLeft, Math.min(coords.left, maxAbsLeft))
            const left = absLeft - wrapperRect.left
            const top = coords.bottom - wrapperRect.top + 8
            setMenuPosition({ top, left })
          } else {
            const maxLeft = Math.max(0, (window.innerWidth || 0) - assumedMenuWidth - margin)
            const clampedLeft = Math.max(margin, Math.min(coords.left, maxLeft))
            setMenuPosition({ top: coords.bottom + 8, left: clampedLeft })
          }
        } else {
          setShowCommandMenu(false)
        }
      } else {
        setShowCommandMenu(false)
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-lg max-w-none focus:outline-none min-h-[400px]',
      },
    },
  })

  // Update editor content when the content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Add Ctrl+S save handler
  useEffect(() => {
    if (!editor) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        onChange(editor.getHTML())
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [editor, onChange])

  if (!editor) {
    return null
  }

  const handleCommandSelect = (action: string) => {
    if (!editor || commandStartPos.current === null) {
      return
    }

    // Store positions before closing menu
    const { from } = editor.state.selection
    const deleteFrom = commandStartPos.current
    const deleteTo = from
    
    // Close menu and clear state
    setShowCommandMenu(false)
    setCommandQuery('')
    commandStartPos.current = null
    
    // Execute the command based on type
    switch (action) {
      // Block-level commands (headings, lists, quotes)
      // These need special handling: if there's text before @, create new line
      case 'setParagraph':
        editor.chain()
          .deleteRange({ from: deleteFrom, to: deleteTo })
          .unsetAllMarks()
          .focus()
          .setParagraph()
          .run()
        break
      case 'toggleHeading1':
        // Delete @ and query, create new paragraph for heading
        editor.chain()
          .deleteRange({ from: deleteFrom, to: deleteTo })
          .insertContent({ type: 'paragraph' })
          .setHeading({ level: 1 })
          .focus()
          .run()
        break
      case 'toggleHeading2':
        editor.chain()
          .deleteRange({ from: deleteFrom, to: deleteTo })
          .insertContent({ type: 'paragraph' })
          .setHeading({ level: 2 })
          .focus()
          .run()
        break
      case 'toggleHeading3':
        editor.chain()
          .deleteRange({ from: deleteFrom, to: deleteTo })
          .insertContent({ type: 'paragraph' })
          .setHeading({ level: 3 })
          .focus()
          .run()
        break
      case 'toggleBulletList':
        editor.chain()
          .deleteRange({ from: deleteFrom, to: deleteTo })
          .insertContent({ type: 'paragraph' })
          .toggleBulletList()
          .focus()
          .run()
        break
      case 'toggleOrderedList':
        editor.chain()
          .deleteRange({ from: deleteFrom, to: deleteTo })
          .insertContent({ type: 'paragraph' })
          .toggleOrderedList()
          .focus()
          .run()
        break
      case 'toggleBlockquote':
        editor.chain()
          .deleteRange({ from: deleteFrom, to: deleteTo })
          .insertContent({ type: 'paragraph' })
          .toggleBlockquote()
          .focus()
          .run()
        break
      
      // Text formatting commands - delete @query, insert zero-width space with mark
      case 'toggleBold': {
        const chain = editor.chain()
          .deleteRange({ from: deleteFrom, to: deleteTo })
          .focus()
          .setMark('bold')
        chain.run()
        break
      }
      
      case 'toggleItalic': {
        const chain = editor.chain()
          .deleteRange({ from: deleteFrom, to: deleteTo })
          .focus()
          .setMark('italic')
        chain.run()
        break
      }
      
      case 'toggleUnderline': {
        const chain = editor.chain()
          .deleteRange({ from: deleteFrom, to: deleteTo })
          .focus()
          .setMark('underline')
        chain.run()
        break
      }
      
      case 'toggleStrike': {
        const chain = editor.chain()
          .deleteRange({ from: deleteFrom, to: deleteTo })
          .focus()
          .setMark('strike')
        chain.run()
        break
      }
      
      case 'toggleCode': {
        const chain = editor.chain()
          .deleteRange({ from: deleteFrom, to: deleteTo })
          .focus()
          .setMark('code')
        chain.run()
        break
      }
      
      // Link via themed dialog
      case 'setLink': {
        pendingRangeRef.current = { from: deleteFrom, to: deleteTo }
        setLinkUrl('')
        setLinkText('')
        setLinkDialogOpen(true)
        break
      }
      
      // Alignment commands
      case 'alignLeft':
        editor.chain()
          .deleteRange({ from: deleteFrom, to: deleteTo })
          .setTextAlign('left')
          .focus()
          .run()
        break
      case 'alignCenter':
        editor.chain()
          .deleteRange({ from: deleteFrom, to: deleteTo })
          .setTextAlign('center')
          .focus()
          .run()
        break
      case 'alignRight':
        editor.chain()
          .deleteRange({ from: deleteFrom, to: deleteTo })
          .setTextAlign('right')
          .focus()
          .run()
        break
      case 'alignJustify':
        editor.chain()
          .deleteRange({ from: deleteFrom, to: deleteTo })
          .setTextAlign('justify')
          .focus()
          .run()
        break
    }
  }

  const handleCloseMenu = () => {
    setShowCommandMenu(false)
    setCommandQuery('')
    commandStartPos.current = null
    editor?.commands.focus()
  }

  return (
    <div ref={wrapperRef} className="notion-editor-wrapper relative">
      {/* Editor */}
      <EditorContent editor={editor} className="text-white" />

      {/* Command Menu */}
      {showCommandMenu && (
        <CommandMenu
          position={menuPosition}
          query={commandQuery}
          onSelect={handleCommandSelect}
          onClose={handleCloseMenu}
        />
      )}

      {/* Themed Link Dialog */}
      {linkDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-zinc-800">
              <h3 className="text-white text-lg font-semibold">Insert Link</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">URL</label>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-0 focus:border-zinc-600"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const btn = document.getElementById('apply-link-btn') as HTMLButtonElement | null
                      btn?.click()
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Link text (optional)</label>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-0 focus:border-zinc-600"
                  placeholder="Visible label (defaults to URL)"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                />
              </div>
            </div>
            <div className="p-5 border-t border-zinc-800 flex justify-end gap-2">
              <button
                className="px-3 py-2 rounded-lg text-sm bg-transparent border border-zinc-700 text-white hover:bg-zinc-800"
                onClick={() => setLinkDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                id="apply-link-btn"
                className="px-3 py-2 rounded-lg text-sm bg-white text-black hover:bg-zinc-200"
                onClick={() => {
                  if (!editor) { setLinkDialogOpen(false); return }
                  const url = linkUrl.trim()
                  const label = (linkText.trim() || url)
                  const range = pendingRangeRef.current
                  pendingRangeRef.current = null
                  setLinkDialogOpen(false)
                  if (!url || !range) return
                  editor.chain()
                    .deleteRange({ from: range.from, to: range.to })
                    .focus()
                    .insertContent({
                      type: 'text',
                      text: label,
                      marks: [ { type: 'link', attrs: { href: url } } ],
                    })
                    .insertContent({ type: 'text', text: ' ' })
                    .run()
                }}
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
