'use client'

import { useEffect, useState, useRef } from 'react'
import { 
  Type,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react'

export interface CommandItem {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  action: string
  keywords?: string[]
}

const commands: CommandItem[] = [
  {
    id: 'text',
    title: 'Text',
    description: 'Convert to normal text (removes heading)',
    icon: Type,
    action: 'setParagraph',
    keywords: ['text', 'paragraph', 'normal', 'p'],
  },
  {
    id: 'heading1',
    title: 'Heading 1',
    description: 'Big section heading (new line)',
    icon: Heading1,
    action: 'toggleHeading1',
    keywords: ['h1', 'heading', 'title'],
  },
  {
    id: 'heading2',
    title: 'Heading 2',
    description: 'Medium section heading (new line)',
    icon: Heading2,
    action: 'toggleHeading2',
    keywords: ['h2', 'heading', 'subtitle'],
  },
  {
    id: 'heading3',
    title: 'Heading 3',
    description: 'Small section heading (new line)',
    icon: Heading3,
    action: 'toggleHeading3',
    keywords: ['h3', 'heading'],
  },
  {
    id: 'bold',
    title: 'Bold',
    description: 'Next text will be bold',
    icon: Bold,
    action: 'toggleBold',
    keywords: ['strong', 'bold', 'b'],
  },
  {
    id: 'italic',
    title: 'Italic',
    description: 'Next text will be italic',
    icon: Italic,
    action: 'toggleItalic',
    keywords: ['em', 'italic', 'i'],
  },
  {
    id: 'underline',
    title: 'Underline',
    description: 'Next text will be underlined',
    icon: UnderlineIcon,
    action: 'toggleUnderline',
    keywords: ['underline', 'u'],
  },
  {
    id: 'strikethrough',
    title: 'Strikethrough',
    description: 'Next text will be strikethrough',
    icon: Strikethrough,
    action: 'toggleStrike',
    keywords: ['strikethrough', 'strike', 's'],
  },
  {
    id: 'code',
    title: 'Code',
    description: 'Next text will be code',
    icon: Code,
    action: 'toggleCode',
    keywords: ['code', 'monospace'],
  },
  {
    id: 'bulletList',
    title: 'Bullet List',
    description: 'Create a bullet list',
    icon: List,
    action: 'toggleBulletList',
    keywords: ['ul', 'bullet', 'list', 'unordered'],
  },
  {
    id: 'orderedList',
    title: 'Numbered List',
    description: 'Create a numbered list',
    icon: ListOrdered,
    action: 'toggleOrderedList',
    keywords: ['ol', 'numbered', 'list', 'ordered'],
  },
  {
    id: 'blockquote',
    title: 'Quote',
    description: 'Create a quote block',
    icon: Quote,
    action: 'toggleBlockquote',
    keywords: ['quote', 'blockquote', 'citation'],
  },
  {
    id: 'link',
    title: 'Link',
    description: 'Add a link',
    icon: LinkIcon,
    action: 'setLink',
    keywords: ['link', 'url', 'href'],
  },
  {
    id: 'alignLeft',
    title: 'Align Left',
    description: 'Align text to the left',
    icon: AlignLeft,
    action: 'alignLeft',
    keywords: ['align', 'left'],
  },
  {
    id: 'alignCenter',
    title: 'Align Center',
    description: 'Center align text',
    icon: AlignCenter,
    action: 'alignCenter',
    keywords: ['align', 'center'],
  },
  {
    id: 'alignRight',
    title: 'Align Right',
    description: 'Align text to the right',
    icon: AlignRight,
    action: 'alignRight',
    keywords: ['align', 'right'],
  },
  {
    id: 'alignJustify',
    title: 'Justify',
    description: 'Justify text',
    icon: AlignJustify,
    action: 'alignJustify',
    keywords: ['align', 'justify'],
  },
]

interface CommandMenuProps {
  position: { top: number; left: number }
  query: string
  onSelect: (action: string) => void
  onClose: () => void
}

export function CommandMenu({ position, query, onSelect, onClose }: CommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  const filteredCommands = commands.filter(cmd => {
    // If query is empty, show all commands
    if (!query || query.trim() === '') {
      return true
    }
    
    const searchQuery = query.toLowerCase().trim()
    return (
      cmd.title.toLowerCase().includes(searchQuery) ||
      cmd.description.toLowerCase().includes(searchQuery) ||
      cmd.keywords?.some(k => k.includes(searchQuery))
    )
  })

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex].action)
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [selectedIndex, filteredCommands, onSelect, onClose])

  // Scroll selected item into view
  useEffect(() => {
    if (menuRef.current) {
      const selectedElement = menuRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  if (filteredCommands.length === 0) {
    return (
      <div
        ref={menuRef}
        className="fixed z-50 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden"
        style={{ top: position.top, left: position.left, minWidth: '300px' }}
      >
        <div className="p-4 text-center text-zinc-500 text-sm">
          No commands found
        </div>
      </div>
    )
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden max-h-[400px] overflow-y-auto command-menu-enter"
      style={{ top: position.top, left: position.left, minWidth: '320px' }}
    >
      <div className="p-2">
        {filteredCommands.map((cmd, index) => {
          const Icon = cmd.icon
          return (
            <button
              key={cmd.id}
              onClick={() => onSelect(cmd.action)}
              className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                index === selectedIndex
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center w-10 h-10 bg-zinc-800 rounded-md flex-shrink-0 mt-0.5">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm mb-0.5">{cmd.title}</div>
                <div className="text-xs text-zinc-500">{cmd.description}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

