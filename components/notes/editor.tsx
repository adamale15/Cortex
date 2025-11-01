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
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-400 underline cursor-pointer',
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
          setMenuPosition({
            top: coords.bottom + 8,
            left: coords.left,
          })
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
          .insertContent({ type: 'paragraph' })
          .setParagraph()
          .focus()
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
      case 'toggleBold':
        editor.chain()
          .deleteRange({ from: deleteFrom, to: deleteTo })
          .focus()
          .insertContent({
            type: 'text',
            text: ' ',
            marks: [{ type: 'bold' }],
          })
          .run()
        break
      
      case 'toggleItalic':
        editor.chain()
          .deleteRange({ from: deleteFrom, to: deleteTo })
          .focus()
          .insertContent({
            type: 'text',
            text: ' ',
            marks: [{ type: 'italic' }],
          })
          .run()
        break
      
      case 'toggleUnderline':
        editor.chain()
          .deleteRange({ from: deleteFrom, to: deleteTo })
          .focus()
          .insertContent({
            type: 'text',
            text: ' ',
            marks: [{ type: 'underline' }],
          })
          .run()
        break
      
      case 'toggleStrike':
        editor.chain()
          .deleteRange({ from: deleteFrom, to: deleteTo })
          .focus()
          .insertContent({
            type: 'text',
            text: ' ',
            marks: [{ type: 'strike' }],
          })
          .run()
        break
      
      case 'toggleCode':
        editor.chain()
          .deleteRange({ from: deleteFrom, to: deleteTo })
          .focus()
          .insertContent({
            type: 'text',
            text: ' ',
            marks: [{ type: 'code' }],
          })
          .run()
        break
      
      // Link
      case 'setLink':
        const url = window.prompt('URL')
        if (url) {
          editor.chain()
            .deleteRange({ from: deleteFrom, to: deleteTo })
            .setLink({ href: url })
            .focus()
            .run()
        }
        break
      
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
    <div className="notion-editor-wrapper relative">
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
    </div>
  )
}
