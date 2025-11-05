'use client'

import { useState } from 'react'
import { Note, Folder } from '@/types'
import { 
  ChevronRight, 
  ChevronDown, 
  ChevronLeft,
  Plus, 
  FolderIcon,
  FileText,
  Settings,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Home,
  ArrowUp,
  ArrowDown,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, rectIntersection, useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// (moved to top)

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
  onMoveFolderUp?: (folderId: string) => void
  onMoveFolderDown?: (folderId: string) => void
  onMoveNoteUp?: (noteId: string) => void
  onMoveNoteDown?: (noteId: string) => void
  onReorderFolders?: (folderIds: string[]) => void
  onReorderNotes?: (noteIds: string[]) => void
  onToggleStar?: (noteId: string, nextStarred: boolean) => void
  onMoveNoteToFolder?: (noteId: string, folderId: string | null) => void
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
  onMoveFolderUp,
  onMoveFolderDown,
  onMoveNoteUp,
  onMoveNoteDown,
  onReorderFolders,
  onReorderNotes,
  onToggleStar,
  onMoveNoteToFolder,
}: NotionSidebarProps) {
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set())
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredNote, setHoveredNote] = useState<string | null>(null)
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

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

  const getStarredNotes = () => {
    return notes.filter((note: any) => note.starred)
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
    <div className={`${isCollapsed ? 'w-16 p-2' : 'w-64 p-3'} h-screen transition-all duration-200`}>
      <div className={`relative bg-zinc-950/80 backdrop-blur border border-zinc-800 rounded-2xl h-full flex flex-col shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] overflow-visible ${isCollapsed ? 'items-center' : ''}`}>{/* panel wrapper */}
      {/* Header */}
      {!isCollapsed && (
      <div className="p-4 border-b border-zinc-800 rounded-t-2xl">
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
      )}
      {/* Collapse toggle button */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-7 w-7 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center shadow-lg"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* When collapsed, hide all content */}
        {!isCollapsed && (
          <button
            onClick={onHomeClick}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors text-sm"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </button>
        )}

        {/* Search Results */}
        {!isCollapsed && searchQuery && (
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
        {!isCollapsed && !searchQuery && (
          <div className="mt-3 space-y-1">
            {/* Favourites (virtual folder) */}
            {getStarredNotes().length > 0 && (
              <div>
                <div className="text-xs font-medium text-zinc-500 px-2 py-1.5 flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-yellow-400" />
                  Favourites
                </div>
                <div className="ml-0 space-y-0.5 mt-0.5">
                  {getStarredNotes().map((note) => (
                    <div key={`fav-${note.id}`}>
                      <button
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
                        <div className="flex items-center gap-1 w-14 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onToggleStar?.(note.id, !(note as any).starred)
                            }}
                            className={`p-1 rounded ${
                              (note as any).starred
                                ? 'text-yellow-400 hover:bg-zinc-700'
                                : 'text-zinc-500 hover:text-white hover:bg-zinc-700'
                            }`}
                            title={(note as any).starred ? 'Unstar' : 'Star'}
                          >
                            <Star className="h-3.5 w-3.5" fill={(note as any).starred ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteNote(note.id)
                            }}
                            className="p-1 rounded text-red-400 hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="my-2 mx-2 border-t border-zinc-800" />
              </div>
            )}
            {/* Folders header */}
            <div className="text-xs font-medium text-zinc-500 px-2 py-1.5">Folders</div>
            {/* Folders (Draggable) */}
            <DndContext
              sensors={sensors}
              collisionDetection={rectIntersection}
              onDragEnd={(event) => {
                const { active, over } = event
                if (!over) return
                const activeId = String(active.id)
                const overId = String(over.id)

                // Move note to folder/uncategorized when dropped over headers
                if (overId.startsWith('move-folder-')) {
                  const folderId = overId.replace('move-folder-', '')
                  onMoveNoteToFolder?.(activeId, folderId)
                  return
                }
                if (overId === 'drop-uncategorized') {
                  onMoveNoteToFolder?.(activeId, null)
                  return
                }

                // Reorder folders
                const folderIds = folders.map(f => f.id)
                if (folderIds.includes(activeId) && folderIds.includes(overId)) {
                  const oldIndex = folders.findIndex(f => f.id === activeId)
                  const newIndex = folders.findIndex(f => f.id === overId)
                  if (oldIndex === -1 || newIndex === -1) return
                  const newOrder = arrayMove(folderIds, oldIndex, newIndex)
                  onReorderFolders?.(newOrder)
                  return
                }

                // Reorder notes within the same folder (including null)
                const sourceNote = notes.find(n => n.id === activeId)
                const targetNote = notes.find(n => n.id === overId)
                if (sourceNote && targetNote && sourceNote.folder_id === targetNote.folder_id) {
                  const list = getNotesInFolder(sourceNote.folder_id)
                  const oldIndex = list.findIndex(n => n.id === activeId)
                  const newIndex = list.findIndex(n => n.id === overId)
                  if (oldIndex === -1 || newIndex === -1) return
                  const newOrder = arrayMove(list.map(n => n.id), oldIndex, newIndex)
                  onReorderNotes?.(newOrder)
                }
              }}
            >
              <SortableContext items={folders.map(f => f.id)} strategy={verticalListSortingStrategy}>
            {folders.map((folder) => {
              const folderNotes = getNotesInFolder(folder.id)
              const isCollapsed = collapsedFolders.has(folder.id)

              return (
                <SortableFolder key={folder.id} id={folder.id}>
                  {/* Folder Header (droppable for moves) */}
                  <DroppableWrapper id={`move-folder-${folder.id}`}>
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
                      {folder.logo_url || (folder as any).logo_signed_url ? (
                        <img src={(folder as any).logo_signed_url || folder.logo_url} alt="logo" className="h-4 w-4 rounded-sm object-cover" />
                      ) : folder.emoji ? (
                        <span className="text-sm">{folder.emoji}</span>
                      ) : (
                        <FolderIcon className="h-3.5 w-3.5 text-zinc-400" />
                      )}
                      <span className="text-xs font-medium truncate">{folder.name}</span>
                    </div>

                    {hoveredFolder === folder.id && (
                      <div className="flex items-center gap-0.5">
                        {onMoveFolderUp && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onMoveFolderUp(folder.id) }}
                            className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                            title="Move up"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                        )}
                        {onMoveFolderDown && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onMoveFolderDown(folder.id) }}
                            className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                            title="Move down"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        )}
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
                  </DroppableWrapper>

                  {/* Folder Notes */}
                  {!isCollapsed && (
                    <div className="ml-4 space-y-0.5 mt-0.5">
                        <SortableContext items={folderNotes.map(n => n.id)} strategy={verticalListSortingStrategy}>
                        {folderNotes.map((note) => (
                          <SortableNote key={note.id} id={note.id}>
                            <button
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
                              <div className="flex items-center gap-1 w-14 justify-end">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onToggleStar?.(note.id, !(note as any).starred)
                                  }}
                                  className={`p-1 rounded ${
                                    (note as any).starred
                                      ? 'text-yellow-400 hover:bg-zinc-700'
                                      : 'text-zinc-500 hover:text-white hover:bg-zinc-700'
                                  }`}
                                  title={(note as any).starred ? 'Unstar' : 'Star'}
                                >
                                  <Star className="h-3.5 w-3.5" fill={(note as any).starred ? 'currentColor' : 'none'} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onDeleteNote(note.id)
                                  }}
                                  className="p-1 rounded text-red-400 hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </button>
                          </SortableNote>
                        ))}
                        </SortableContext>
                    </div>
                  )}
                </SortableFolder>
              )
            })}
              </SortableContext>

            {/* Notes without folder */}
            {getNotesInFolder(null).length > 0 && (
              <DroppableWrapper id={'drop-uncategorized'}>
              <div>
                <div className="my-2 mx-2 border-t border-zinc-800" />
                <DroppableWrapper id={'drop-uncategorized'}>
                  <div className="text-xs font-medium text-zinc-500 px-2 py-1.5">Uncategorized</div>
                </DroppableWrapper>
                  <SortableContext items={getNotesInFolder(null).map(n => n.id)} strategy={verticalListSortingStrategy}>
                  {getNotesInFolder(null).map((note) => (
                    <SortableNote key={note.id} id={note.id}>
                      <button
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
                        <div className="flex items-center gap-1 w-14 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onToggleStar?.(note.id, !(note as any).starred)
                            }}
                            className={`p-1 rounded ${
                              (note as any).starred
                                ? 'text-yellow-400 hover:bg-zinc-700'
                                : 'text-zinc-500 hover:text-white hover:bg-zinc-700'
                            }`}
                            title={(note as any).starred ? 'Unstar' : 'Star'}
                          >
                            <Star className="h-3.5 w-3.5" fill={(note as any).starred ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteNote(note.id)
                            }}
                            className="p-1 rounded text-red-400 hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </button>
                    </SortableNote>
                  ))}
                  </SortableContext>
                  {/* No visible move targets; drop directly on folder headers */}
              </div>
              </DroppableWrapper>
            )}
            </DndContext>
          </div>
        )}
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-zinc-800 rounded-b-2xl w-full">
          <Button
            onClick={() => onNewNote()}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm h-8"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>
      )}
      </div>
    </div>
  )
}
// Sortable wrappers
function SortableFolder({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    willChange: 'transform',
  } as React.CSSProperties
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  )
}

function SortableNote({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    willChange: 'transform',
  } as React.CSSProperties
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  )
}

function DroppableWrapper({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={`pointer-events-auto rounded-md ${isOver ? 'ring-1 ring-zinc-600 bg-zinc-900/60' : ''}`}
      style={{ paddingTop: 2, paddingBottom: 2 }}
    >
      {children}
    </div>
  )
}