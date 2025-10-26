'use client'

import { useState, useEffect } from 'react'
import { Note, Folder } from '@/types'
import { getNotes, createNote, updateNote, deleteNote, reorderNotes } from '@/app/actions/notes'
import { getFolders, createFolder, updateFolder, deleteFolder } from '@/app/actions/folders'
import { Editor } from '@/components/notes/editor'
import { DraggableNoteCard } from '@/components/notes/draggable-note-card'
import { Navbar } from '@/components/navbar'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Search, X, FolderPlus, Folder as FolderIcon, Edit2, Trash2, ArrowLeft, FileText } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<Folder | 'all' | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    folder_id: '',
  })
  const [folderFormData, setFolderFormData] = useState({
    name: '',
    color: '#6366f1',
    emoji: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; noteId: string | null }>({
    isOpen: false,
    noteId: null,
  })
  const [deleteFolderConfirm, setDeleteFolderConfirm] = useState<{ isOpen: boolean; folderId: string | null }>({
    isOpen: false,
    folderId: null,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    await Promise.all([loadNotes(), loadFolders()])
    setLoading(false)
  }

  const loadNotes = async () => {
    const result = await getNotes()
    if (result.notes) {
      setNotes(result.notes)
    }
  }

  const loadFolders = async () => {
    const result = await getFolders()
    if (result.folders) {
      setFolders(result.folders)
    }
  }

  const handleNewNote = () => {
    setEditingNote(null)
    const folderId = selectedFolder && selectedFolder !== 'all' ? selectedFolder.id : ''
    setFormData({ title: '', content: '', tags: '', folder_id: folderId })
    setIsModalOpen(true)
    setError(null)
  }

  const handleEdit = (note: Note) => {
    setEditingNote(note)
    setFormData({
      title: note.title,
      content: note.content,
      tags: note.tags.join(', '),
      folder_id: note.folder_id || '',
    })
    setIsModalOpen(true)
    setError(null)
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    setIsSaving(true)
    setError(null)

    const data = new FormData()
    data.append('title', formData.title)
    data.append('content', formData.content)
    data.append('tags', formData.tags)
    data.append('folder_id', formData.folder_id)

    const result = editingNote
      ? await updateNote(editingNote.id, data)
      : await createNote(data)

    if (result.error) {
      setError(result.error)
    } else {
      setIsModalOpen(false)
      await loadNotes()
    }

    setIsSaving(false)
  }

  const handleDelete = async (id: string) => {
    setDeleteConfirm({ isOpen: true, noteId: id })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.noteId) return

    await deleteNote(deleteConfirm.noteId)
    setDeleteConfirm({ isOpen: false, noteId: null })
    await loadNotes()
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = filteredNotes.findIndex((note) => note.id === active.id)
    const newIndex = filteredNotes.findIndex((note) => note.id === over.id)

    const newNotes = arrayMove(filteredNotes, oldIndex, newIndex)
    
    // Update local state
    setNotes(prevNotes => {
      const otherNotes = prevNotes.filter(n => !filteredNotes.includes(n))
      return [...otherNotes, ...newNotes]
    })

    // Update positions in database
    const noteIds = newNotes.map((note) => note.id)
    await reorderNotes(noteIds)
  }

  // Folder management
  const handleNewFolder = () => {
    setEditingFolder(null)
    setFolderFormData({ name: '', color: '#6366f1', emoji: '' })
    setIsFolderModalOpen(true)
    setError(null)
  }

  const handleEditFolder = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingFolder(folder)
    setFolderFormData({ name: folder.name, color: folder.color, emoji: folder.emoji || '' })
    setIsFolderModalOpen(true)
    setError(null)
  }

  const handleSaveFolder = async () => {
    if (!folderFormData.name.trim()) {
      setError('Folder name is required')
      return
    }

    setIsSaving(true)
    setError(null)

    const data = new FormData()
    data.append('name', folderFormData.name)
    data.append('color', folderFormData.color)
    data.append('emoji', folderFormData.emoji)

    const result = editingFolder
      ? await updateFolder(editingFolder.id, data)
      : await createFolder(data)

    if (result.error) {
      setError(result.error)
    } else {
      setIsFolderModalOpen(false)
      await loadFolders()
    }

    setIsSaving(false)
  }

  const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteFolderConfirm({ isOpen: true, folderId })
  }

  const confirmDeleteFolder = async () => {
    if (!deleteFolderConfirm.folderId) return

    await deleteFolder(deleteFolderConfirm.folderId)
    setDeleteFolderConfirm({ isOpen: false, folderId: null })
    await Promise.all([loadFolders(), loadNotes()])
    
    // If currently viewing the deleted folder, go back to folder view
    if (selectedFolder && selectedFolder !== 'all' && selectedFolder.id === deleteFolderConfirm.folderId) {
      setSelectedFolder(null)
    }
  }

  const handleFolderClick = (folder: Folder | 'all') => {
    setSelectedFolder(folder)
    setSearchQuery('')
  }

  const handleBackToFolders = () => {
    setSelectedFolder(null)
    setSearchQuery('')
  }

  // Filter notes based on search query and selected folder
  const filteredNotes = notes.filter(note => {
    // Search filter
    const query = searchQuery.toLowerCase()
    const matchesSearch = !searchQuery || (
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.tags?.some(tag => tag.toLowerCase().includes(query))
    )

    // Folder filter
    if (selectedFolder === 'all') {
      return matchesSearch && !note.folder_id
    } else if (selectedFolder && typeof selectedFolder !== 'string') {
      return matchesSearch && note.folder_id === selectedFolder.id
    }

    return matchesSearch
  })

  // Count notes per folder
  const getNotesCount = (folderId: string | null) => {
    return notes.filter(note => note.folder_id === folderId).length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Get search results across all notes
  const searchResults = searchQuery ? notes.filter(note => {
    const query = searchQuery.toLowerCase()
    return (
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }) : []

  // Folder view (no folder selected)
  if (!selectedFolder) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        
        <main className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Notes</h1>
              <p className="text-zinc-400">Organize your thoughts</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 md:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Search all notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 w-full md:w-[300px]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <Button
                onClick={handleNewFolder}
                className="bg-zinc-800 hover:bg-zinc-700 text-white"
              >
                <FolderPlus className="w-5 h-5 mr-2" />
                New Folder
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {searchQuery ? (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">
                  Search Results
                </h2>
                <p className="text-zinc-400">
                  Found {searchResults.length} {searchResults.length === 1 ? 'note' : 'notes'} matching "{searchQuery}"
                </p>
              </div>

              {searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-400 text-lg">No notes found matching your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((note) => (
                    <div key={note.id} className="min-h-[180px]">
                      <DraggableNoteCard
                        note={note}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Folders Grid */
            <>
              {folders.length === 0 && getNotesCount(null) === 0 ? (
                <div className="text-center py-12">
                  <FolderIcon className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-400 text-lg mb-4">No folders yet. Create your first folder!</p>
                  <Button
                    onClick={handleNewFolder}
                    className="bg-white hover:bg-zinc-200 text-black"
                  >
                    <FolderPlus className="w-5 h-5 mr-2" />
                    Create Folder
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {/* User-created folders */}
                  {folders.map(folder => (
                    <div
                      key={folder.id}
                      onClick={() => handleFolderClick(folder)}
                      className="group relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 cursor-pointer hover:border-zinc-700 hover:bg-zinc-800/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        {folder.emoji ? (
                          <div className="text-5xl">
                            {folder.emoji}
                          </div>
                        ) : (
                          <FolderIcon
                            className="w-12 h-12"
                            style={{ color: folder.color }}
                          />
                        )}
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            onClick={(e) => handleEditFolder(folder, e)}
                            className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteFolder(folder.id, e)}
                            className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-xl font-semibold text-white mb-2">
                        {folder.name}
                      </h3>
                      <p className="text-zinc-400 text-sm">
                        {getNotesCount(folder.id)} {getNotesCount(folder.id) === 1 ? 'note' : 'notes'}
                      </p>
                    </div>
                  ))}

                  {/* All Notes folder */}
                  {getNotesCount(null) > 0 && (
                    <div
                      onClick={() => handleFolderClick('all')}
                      className="group relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 cursor-pointer hover:border-zinc-700 hover:bg-zinc-800/50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <FileText className="w-12 h-12 text-zinc-500" />
                      </div>

                      <h3 className="text-xl font-semibold text-white mb-2">
                        All Notes
                      </h3>
                      <p className="text-zinc-400 text-sm">
                        {getNotesCount(null)} {getNotesCount(null) === 1 ? 'note' : 'notes'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>

        {/* Folder Modal */}
        {isFolderModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 rounded-2xl max-w-md w-full border border-zinc-800">
              <div className="border-b border-zinc-800 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  {editingFolder ? 'Edit Folder' : 'Create New Folder'}
                </h2>
                <button
                  onClick={() => setIsFolderModalOpen(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

              <div className="space-y-2">
                <Label htmlFor="folder-name" className="text-white">Folder Name</Label>
                <Input
                  id="folder-name"
                  value={folderFormData.name}
                  onChange={(e) => setFolderFormData({ ...folderFormData, name: e.target.value })}
                  placeholder="Enter folder name..."
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="folder-emoji" className="text-white">Icon (Optional)</Label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center text-3xl">
                    {folderFormData.emoji || '📁'}
                  </div>
                  <Input
                    id="folder-emoji"
                    value={folderFormData.emoji}
                    onChange={(e) => setFolderFormData({ ...folderFormData, emoji: e.target.value })}
                    placeholder="Paste an emoji..."
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    maxLength={2}
                  />
                  {folderFormData.emoji && (
                    <button
                      onClick={() => setFolderFormData({ ...folderFormData, emoji: '' })}
                      className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-500">Copy and paste any emoji (e.g., 🎨 📚 💼 🎯)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="folder-color" className="text-white">Color (for icon background)</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="folder-color"
                    type="color"
                    value={folderFormData.color}
                    onChange={(e) => setFolderFormData({ ...folderFormData, color: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer bg-zinc-800 border border-zinc-700"
                  />
                  <Input
                    value={folderFormData.color}
                    onChange={(e) => setFolderFormData({ ...folderFormData, color: e.target.value })}
                    placeholder="#6366f1"
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-800 p-6 flex gap-3 justify-end">
                <Button
                  onClick={() => setIsFolderModalOpen(false)}
                  variant="outline"
                  disabled={isSaving}
                  className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveFolder}
                  disabled={isSaving}
                  className="bg-white hover:bg-zinc-200 text-black"
                >
                  {isSaving ? 'Saving...' : editingFolder ? 'Update Folder' : 'Create Folder'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Folder Confirmation */}
        <ConfirmDialog
          isOpen={deleteFolderConfirm.isOpen}
          title="Delete Folder"
          message="Are you sure you want to delete this folder? Notes in this folder will be moved to 'All Notes'."
          onConfirm={confirmDeleteFolder}
          onCancel={() => setDeleteFolderConfirm({ isOpen: false, folderId: null })}
          confirmText="Delete"
          cancelText="Cancel"
        />
      </div>
    )
  }

  // Notes view (folder selected)
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6">
        {/* Header with back button */}
        <div className="mb-6">
          <button
            onClick={handleBackToFolders}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Folders
          </button>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              {selectedFolder === 'all' ? (
                <>
                  <FileText className="w-10 h-10 text-zinc-500" />
                  <div>
                    <h1 className="text-3xl font-bold text-white">All Notes</h1>
                    <p className="text-zinc-400">Uncategorized notes</p>
                  </div>
                </>
              ) : (
                <>
                  {selectedFolder.emoji ? (
                    <div className="text-5xl">
                      {selectedFolder.emoji}
                    </div>
                  ) : (
                    <FolderIcon
                      className="w-10 h-10"
                      style={{ color: selectedFolder.color }}
                    />
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-white">{selectedFolder.name}</h1>
                    <p className="text-zinc-400">{filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}</p>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 w-full md:w-[300px]"
                />
              </div>

              <Button
                onClick={handleNewNote}
                className="bg-white hover:bg-zinc-200 text-black"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Note
              </Button>
            </div>
          </div>
        </div>

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-4">
              {searchQuery ? 'No notes found matching your search.' : 'No notes in this folder yet.'}
            </p>
            {!searchQuery && (
              <Button
                onClick={handleNewNote}
                className="bg-white hover:bg-zinc-200 text-black"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Note
              </Button>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={filteredNotes.map(n => n.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotes.map((note) => (
                  <div key={note.id} className="min-h-[180px]">
                    <DraggableNoteCard
                      note={note}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      {/* Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-zinc-800">
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingNote ? 'Edit Note' : 'Create New Note'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter note title..."
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="folder" className="text-white">Folder (Optional)</Label>
                <select
                  id="folder"
                  value={formData.folder_id}
                  onChange={(e) => setFormData({ ...formData, folder_id: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2"
                >
                  <option value="">No Folder</option>
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-white">Content</Label>
                <Editor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags" className="text-white">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="work, personal, ideas (comma separated)"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 p-6 flex gap-3 justify-end">
              <Button
                onClick={() => setIsModalOpen(false)}
                variant="outline"
                disabled={isSaving}
                className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-white hover:bg-zinc-200 text-black"
              >
                {isSaving ? 'Saving...' : editingNote ? 'Update Note' : 'Create Note'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Note Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, noteId: null })}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}
