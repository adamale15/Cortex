'use client'

import { useState, useEffect } from 'react'
import { Note, Folder } from '@/types'
import { getNotes, createNote, updateNote, deleteNote } from '@/app/actions/notes'
import { getFolders, createFolder, updateFolder, deleteFolder } from '@/app/actions/folders'
import { NotionSidebar } from '@/components/notes/notion-sidebar'
import { NoteView } from '@/components/notes/note-view'
import { EmptyState } from '@/components/notes/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NotesPage() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [searchHighlight, setSearchHighlight] = useState<string | null>(null)
  
  // Modals
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const [folderFormData, setFolderFormData] = useState({
    name: '',
    color: '#6366f1',
    emoji: '',
  })
  
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [newNoteFolderId, setNewNoteFolderId] = useState<string | undefined>(undefined)
  const [noteFormData, setNoteFormData] = useState({
    title: '',
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Confirmations
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; noteId: string | null }>({
    isOpen: false,
    noteId: null,
  })
  const [deleteFolderConfirm, setDeleteFolderConfirm] = useState<{ isOpen: boolean; folderId: string | null }>({
    isOpen: false,
    folderId: null,
  })

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

  const handleNoteSelect = (noteId: string, searchQuery?: string) => {
    setSelectedNoteId(noteId)
    setSearchHighlight(searchQuery || null)
  }

  const handleNewNote = (folderId?: string) => {
    setNewNoteFolderId(folderId)
    setNoteFormData({ title: '' })
    setIsNoteModalOpen(true)
    setError(null)
  }

  const handleCreateNote = async () => {
    if (!noteFormData.title.trim()) {
      setError('Title is required')
      return
    }

    setIsSaving(true)
    setError(null)

    const data = new FormData()
    data.append('title', noteFormData.title)
    data.append('content', '')
    data.append('tags', '')
    if (newNoteFolderId) {
      data.append('folder_id', newNoteFolderId)
    }

    const result = await createNote(data)

    if (result.error) {
      setError(result.error)
    } else {
      setIsNoteModalOpen(false)
      await loadNotes()
      if (result.note) {
        setSelectedNoteId(result.note.id)
      }
    }

    setIsSaving(false)
  }

  const handleUpdateNote = async (noteId: string, updates: { title?: string; content?: string; folder_id?: string | null; tags?: string }) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return

    const data = new FormData()
    data.append('title', updates.title ?? note.title)
    data.append('content', updates.content ?? note.content)
    data.append('tags', updates.tags ?? note.tags.join(', '))
    data.append('folder_id', updates.folder_id ?? note.folder_id ?? '')

    const result = await updateNote(noteId, data)
    
    if (!result.error) {
      await loadNotes()
    }
  }

  const handleDeleteNote = (noteId: string) => {
    setDeleteConfirm({ isOpen: true, noteId })
  }

  const confirmDeleteNote = async () => {
    if (!deleteConfirm.noteId) return

    await deleteNote(deleteConfirm.noteId)
    
    if (selectedNoteId === deleteConfirm.noteId) {
      setSelectedNoteId(null)
    }
    
    setDeleteConfirm({ isOpen: false, noteId: null })
    await loadNotes()
  }

  const handleNewFolder = () => {
    setEditingFolder(null)
    setFolderFormData({ name: '', color: '#6366f1', emoji: '' })
    setIsFolderModalOpen(true)
    setError(null)
  }

  const handleEditFolder = (folder: Folder) => {
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

  const handleDeleteFolder = (folderId: string) => {
    setDeleteFolderConfirm({ isOpen: true, folderId })
  }

  const confirmDeleteFolder = async () => {
    if (!deleteFolderConfirm.folderId) return

    await deleteFolder(deleteFolderConfirm.folderId)
    setDeleteFolderConfirm({ isOpen: false, folderId: null })
    await Promise.all([loadFolders(), loadNotes()])
  }

  const handleHomeClick = () => {
    router.push('/dashboard')
  }

  const handleEditNoteFromSidebar = (note: Note) => {
    setSelectedNoteId(note.id)
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-black">
        <div className="w-64 bg-zinc-950 border-r border-zinc-800" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    )
  }

  const selectedNote = notes.find(n => n.id === selectedNoteId)

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Sidebar */}
      <NotionSidebar
        folders={folders}
        notes={notes}
        selectedNoteId={selectedNoteId}
        onNoteSelect={handleNoteSelect}
        onNewNote={handleNewNote}
        onNewFolder={handleNewFolder}
        onEditFolder={handleEditFolder}
        onDeleteFolder={handleDeleteFolder}
        onEditNote={handleEditNoteFromSidebar}
        onDeleteNote={handleDeleteNote}
        onHomeClick={handleHomeClick}
      />

      {/* Main Content */}
      {selectedNote ? (
        <NoteView
          key={`${selectedNote.id}-${searchHighlight || ''}`}
          note={selectedNote}
          folders={folders}
          onUpdate={handleUpdateNote}
          onDelete={handleDeleteNote}
          searchHighlight={searchHighlight}
        />
      ) : (
        <EmptyState
          hasNotes={notes.length > 0}
          onNewNote={() => handleNewNote()}
          onNewFolder={handleNewFolder}
        />
      )}

      {/* New Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl max-w-md w-full border border-zinc-800">
            <div className="border-b border-zinc-800 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Create New Note</h2>
              <button
                onClick={() => setIsNoteModalOpen(false)}
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
                <Label htmlFor="note-title" className="text-white">Title</Label>
                <Input
                  id="note-title"
                  value={noteFormData.title}
                  onChange={(e) => setNoteFormData({ title: e.target.value })}
                  placeholder="Enter note title..."
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateNote()
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>

            <div className="border-t border-zinc-800 p-6 flex gap-3 justify-end">
              <Button
                onClick={() => setIsNoteModalOpen(false)}
                variant="outline"
                disabled={isSaving}
                className="bg-transparent border-zinc-700 text-white hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateNote}
                disabled={isSaving}
                className="bg-white hover:bg-zinc-200 text-black"
              >
                {isSaving ? 'Creating...' : 'Create Note'}
              </Button>
            </div>
          </div>
        </div>
      )}

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
                  autoFocus
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

      {/* Delete Note Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        onConfirm={confirmDeleteNote}
        onCancel={() => setDeleteConfirm({ isOpen: false, noteId: null })}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Delete Folder Confirmation */}
      <ConfirmDialog
        isOpen={deleteFolderConfirm.isOpen}
        title="Delete Folder"
        message="Are you sure you want to delete this folder? Notes in this folder will be moved to 'Uncategorized'."
        onConfirm={confirmDeleteFolder}
        onCancel={() => setDeleteFolderConfirm({ isOpen: false, folderId: null })}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}
