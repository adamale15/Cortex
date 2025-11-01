'use client'

import { useState } from 'react'
import { Note, Folder } from '@/types'
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  FolderIcon,
  FileText,
  Settings,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Home
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface NotionSidebarProps {
  folders: Folder[]
  notes: Note[]
  selectedNoteId: string | null
  onNoteSelect: (noteId: string, searchQuery?: string) => void
  onNewNote: (folderId?: string) => void
  onNewFolder: () => void
  onEditFolder: (folder: Folder) => void
  onDeleteFolder: (folderId: string) => void
  onEditNote: (note: Note) => void
  onDeleteNote: (noteId: string) => void
  onHomeClick: () => void
}

export function NotionSidebar({
  folders,
  notes,
  selectedNoteId,
  onNoteSelect,
  onNewNote,
  onNewFolder,
  onEditFolder,
  onDeleteFolder,
  onEditNote,
  onDeleteNote,
  onHomeClick,
}: NotionSidebarProps) {
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredNote, setHoveredNote] = useState<string | null>(null)
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null)

  const toggleFolder = (folderId: string) => {
    const newCollapsed = new Set(collapsedFolders)
    if (newCollapsed.has(folderId)) {
      newCollapsed.delete(folderId)
    } else {
      newCollapsed.add(folderId)
    }
    setCollapsedFolders(newCollapsed)
  }

  const getNotesInFolder = (folderId: string | null) => {
    return notes.filter(note => note.folder_id === folderId)
  }

  // Helper function to get text content from HTML
  const getTextContent = (html: string) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  // Helper function to get search preview/snippet
  const getSearchPreview = (note: Note, query: string) => {
    const title = note.title.toLowerCase()
    const content = getTextContent(note.content).toLowerCase()
    const searchLower = query.toLowerCase()
    
    // Check if found in title
    if (title.includes(searchLower)) {
      return { text: note.title, location: 'title' }
    }
    
    // Find in content
    const index = content.indexOf(searchLower)
    if (index !== -1) {
      const start = Math.max(0, index - 30)
      const end = Math.min(content.length, index + query.length + 30)
      let snippet = content.slice(start, end)
      
      if (start > 0) snippet = '...' + snippet
      if (end < content.length) snippet = snippet + '...'
      
      return { text: snippet, location: 'content', index }
    }
    
    return { text: '', location: '' }
  }

  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return false
    const query = searchQuery.toLowerCase()
    return (
      note.title.toLowerCase().includes(query) ||
      getTextContent(note.content).toLowerCase().includes(query)
    )
  })

  return (
    <div className="w-64 bg-zinc-950 border-r border-zinc-800 h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-sm">Cortex Notes</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={onNewFolder}
            className="h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 text-xs bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Home */}
        <button
          onClick={onHomeClick}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors text-sm"
        >
          <Home className="h-4 w-4" />
          <span>Home</span>
        </button>

        {/* Search Results */}
        {searchQuery && (
          <div className="mt-3">
            <div className="text-xs font-medium text-zinc-500 px-2 mb-1">Search Results ({filteredNotes.length})</div>
            {filteredNotes.length === 0 ? (
              <div className="text-xs text-zinc-600 px-2 py-1">No results</div>
            ) : (
              filteredNotes.map((note) => {
                const preview = getSearchPreview(note, searchQuery)
                return (
                  <button
                    key={note.id}
                    onClick={() => onNoteSelect(note.id, searchQuery)}
                    onMouseEnter={() => setHoveredNote(note.id)}
                    onMouseLeave={() => setHoveredNote(null)}
                    className={`w-full flex flex-col items-start gap-1 px-2 py-2 rounded-md transition-colors text-sm group ${
                      selectedNoteId === note.id
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    <div className="w-full flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="flex-1 text-left truncate text-xs font-medium">{note.title}</span>
                      {hoveredNote === note.id && (
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onEditNote(note)
                            }}
                            className="p-1 hover:bg-zinc-700 rounded"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteNote(note.id)
                            }}
                            className="p-1 hover:bg-zinc-700 rounded text-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    {preview.text && (
                      <div className="w-full text-[10px] text-zinc-600 leading-tight pl-5">
                        <span className="italic">{preview.location === 'title' ? 'In title' : 'In content'}:</span>{' '}
                        <span 
                          dangerouslySetInnerHTML={{ 
                            __html: preview.text.replace(
                              new RegExp(`(${searchQuery})`, 'gi'),
                              '<mark class="sidebar-search-highlight bg-yellow-400 text-black px-1 py-0.5 rounded font-semibold">$1</mark>'
                            )
                          }}
                        />
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>
        )}

        {/* Folders & Notes */}
        {!searchQuery && (
          <div className="mt-3 space-y-1">
            {/* Folders */}
            {folders.map((folder) => {
              const folderNotes = getNotesInFolder(folder.id)
              const isCollapsed = collapsedFolders.has(folder.id)

              return (
                <div key={folder.id}>
                  {/* Folder Header */}
                  <div
                    onMouseEnter={() => setHoveredFolder(folder.id)}
                    onMouseLeave={() => setHoveredFolder(null)}
                    className="group flex items-center gap-1 px-2 py-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                  >
                    <button
                      onClick={() => toggleFolder(folder.id)}
                      className="p-0.5 hover:bg-zinc-800 rounded"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                    
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {folder.emoji ? (
                        <span className="text-sm">{folder.emoji}</span>
                      ) : (
                        <FolderIcon className="h-3.5 w-3.5" style={{ color: folder.color }} />
                      )}
                      <span className="text-xs font-medium truncate">{folder.name}</span>
                    </div>

                    {hoveredFolder === folder.id && (
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => onNewNote(folder.id)}
                          className="p-1 hover:bg-zinc-700 rounded"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditFolder(folder)
                          }}
                          className="p-1 hover:bg-zinc-700 rounded"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteFolder(folder.id)
                          }}
                          className="p-1 hover:bg-zinc-700 rounded text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Folder Notes */}
                  {!isCollapsed && (
                    <div className="ml-4 space-y-0.5 mt-0.5">
                      {folderNotes.map((note) => (
                        <button
                          key={note.id}
                          onClick={() => onNoteSelect(note.id)}
                          onMouseEnter={() => setHoveredNote(note.id)}
                          onMouseLeave={() => setHoveredNote(null)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-sm group ${
                            selectedNoteId === note.id
                              ? 'bg-zinc-800 text-white'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                          }`}
                        >
                          <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="flex-1 text-left truncate text-xs">{note.title}</span>
                          {hoveredNote === note.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteNote(note.id)
                              }}
                              className="p-1 hover:bg-zinc-700 rounded text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Notes without folder */}
            {getNotesInFolder(null).length > 0 && (
              <div>
                <div className="text-xs font-medium text-zinc-500 px-2 py-1.5">Uncategorized</div>
                {getNotesInFolder(null).map((note) => (
                  <button
                    key={note.id}
                    onClick={() => onNoteSelect(note.id)}
                    onMouseEnter={() => setHoveredNote(note.id)}
                    onMouseLeave={() => setHoveredNote(null)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-sm group ${
                      selectedNoteId === note.id
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="flex-1 text-left truncate text-xs">{note.title}</span>
                    {hoveredNote === note.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteNote(note.id)
                        }}
                        className="p-1 hover:bg-zinc-700 rounded text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-800">
        <Button
          onClick={() => onNewNote()}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm h-8"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>
    </div>
  )
}

