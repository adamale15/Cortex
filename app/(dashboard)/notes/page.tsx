'use client'

import { useState, useEffect } from 'react'
import { Note, Folder } from '@/types'
import { getNotes, createNote, updateNote, deleteNote, reorderNotes, toggleNoteStar, moveNoteToFolder } from '@/app/actions/notes'
import { getFolders, createFolder, updateFolder, deleteFolder, reorderFolders } from '@/app/actions/folders'
import { NotionSidebar } from '@/components/notes/notion-sidebar'
import { NoteView } from '@/components/notes/note-view'
import { EmptyState } from '@/components/notes/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient as createBrowserSupabase } from '@/lib/supabase/client'
import { ActivateAIButton } from '@/components/ai/activate-ai-button'
import { AIWorkspaceShift } from '@/components/ai/ai-workspace-shift'

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
    emoji: '',
    logoFile: null as File | null,
    clearLogo: false,
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
      // If bucket is private, generate signed URLs for any logo paths
      const supabase = createBrowserSupabase()
      const augmented = await Promise.all(
        result.folders.map(async (f) => {
          const folder: any = { ...f }
          if (folder.logo_url) {
            const isHttp = typeof folder.logo_url === 'string' && folder.logo_url.startsWith('http')
            if (!isHttp) {
              const { data, error } = await supabase
                .storage
                .from('folder-logos')
                .createSignedUrl(folder.logo_url, 60 * 60) // 1 hour
              if (!error && data?.signedUrl) {
                folder.logo_signed_url = data.signedUrl
              }
            } else {
              folder.logo_signed_url = folder.logo_url
            }
          }
          return folder
        })
      )
      setFolders(augmented as any)
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
    setFolderFormData({ name: '', emoji: '', logoFile: null, clearLogo: false })
    setIsFolderModalOpen(true)
    setError(null)
  }

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder)
    setFolderFormData({ name: folder.name, emoji: folder.emoji || '', logoFile: null, clearLogo: false })
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
    data.append('emoji', folderFormData.emoji)
    if (folderFormData.logoFile) data.append('logo_file', folderFormData.logoFile)
    if (folderFormData.clearLogo) data.append('clear_logo', 'true')

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

  // Reorder helpers
  const moveFolder = async (folderId: string, direction: 'up' | 'down') => {
    const index = folders.findIndex(f => f.id === folderId)
    if (index === -1) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= folders.length) return
    const newOrder = [...folders]
    const [moved] = newOrder.splice(index, 1)
    newOrder.splice(targetIndex, 0, moved)
    setFolders(newOrder)
    await reorderFolders(newOrder.map(f => f.id))
    await loadFolders()
  }

  const moveNote = async (noteId: string, direction: 'up' | 'down') => {
    const index = notes.findIndex(n => n.id === noteId)
    if (index === -1) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= notes.length) return
    const newOrder = [...notes]
    const [moved] = newOrder.splice(index, 1)
    newOrder.splice(targetIndex, 0, moved)
    setNotes(newOrder)
    await reorderNotes(newOrder.map(n => n.id))
    await loadNotes()
  }

  const handleToggleStar = async (noteId: string, nextStarred: boolean) => {
    // optimistic UI
    setNotes(prev => prev.map(n => n.id === noteId ? ({ ...n, starred: nextStarred } as any) : n))
    const result = await toggleNoteStar(noteId, nextStarred)
    if (result.error) {
      // revert on error
      setNotes(prev => prev.map(n => n.id === noteId ? ({ ...n, starred: !nextStarred } as any) : n))
    } else {
      // reload to respect ordering (starred first)
      await loadNotes()
    }
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

  const handleMoveNoteToFolder = async (noteId: string, folderId: string | null) => {
    await moveNoteToFolder(noteId, folderId)
    await loadNotes()
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
    <AIWorkspaceShift>
      <div className="relative flex h-screen bg-black overflow-hidden">
        {/* Soft background glow like homepage */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute left-1/2 top-12 h-96 w-96 -translate-x-1/2 rounded-[28px] bg-gradient-to-br from-indigo-800/40 via-zinc-900 to-sky-800/30 blur-3xl opacity-70" />
        </div>
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
          onMoveFolderUp={(id) => moveFolder(id, 'up')}
          onMoveFolderDown={(id) => moveFolder(id, 'down')}
          onMoveNoteUp={(id) => moveNote(id, 'up')}
          onMoveNoteDown={(id) => moveNote(id, 'down')}
          onReorderFolders={async (ids) => {
            // optimistic UI
            const reordered = ids.map(id => folders.find(f => f.id === id)!).filter(Boolean)
            setFolders(reordered)
            await reorderFolders(ids)
            await loadFolders()
          }}
          onReorderNotes={async (ids) => {
            const reordered = ids.map(id => notes.find(n => n.id === id)!).filter(Boolean)
            setNotes(reordered)
            await reorderNotes(ids)
            await loadNotes()
          }}
          onToggleStar={handleToggleStar}
          onMoveNoteToFolder={handleMoveNoteToFolder}
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
                  <Label htmlFor="note-title" className="text-white">
                    Title
                  </Label>
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
                  disabled={isSaving}
                  className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateNote}
                  disabled={isSaving}
                  className="bg-zinc-700 border border-zinc-600 hover:bg-zinc-600 text-white"
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
                  <Label htmlFor="folder-name" className="text-white">
                    Folder Name
                  </Label>
                  <Input
                    id="folder-name"
                    value={folderFormData.name}
                    onChange={(e) =>
                      setFolderFormData({ ...folderFormData, name: e.target.value })
                    }
                    placeholder="Enter folder name..."
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="folder-emoji" className="text-white">
                    Icon (Optional)
                  </Label>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center overflow-hidden">
                      {folderFormData.logoFile ? (
                        <img
                          src={URL.createObjectURL(folderFormData.logoFile)}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      ) : editingFolder?.logo_url ? (
                        <img
                          src={editingFolder.logo_url}
                          alt="logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">{folderFormData.emoji || '📁'}</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        id="folder-emoji"
                        value={folderFormData.emoji}
                        onChange={(e) =>
                          setFolderFormData({ ...folderFormData, emoji: e.target.value })
                        }
                        placeholder="Paste an emoji (optional)"
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                        maxLength={2}
                      />
                      <input
                        id="folder-logo"
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setFolderFormData({
                            ...folderFormData,
                            logoFile: e.target.files?.[0] || null,
                            clearLogo: false,
                          })
                        }
                        className="text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-zinc-800 file:text-white hover:file:bg-zinc-700"
                      />
                      {(editingFolder?.logo_url || folderFormData.logoFile) && (
                        <label className="flex items-center gap-2 text-xs text-zinc-400">
                          <input
                            type="checkbox"
                            checked={folderFormData.clearLogo}
                            onChange={(e) =>
                              setFolderFormData({
                                ...folderFormData,
                                clearLogo: e.target.checked,
                                logoFile: e.target.checked ? null : folderFormData.logoFile,
                              })
                            }
                          />
                          Remove logo image
                        </label>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Upload an image or use an emoji. Uploaded image takes priority.
                  </p>
                </div>

                {/* Color removed as requested */}
              </div>

              <div className="border-t border-zinc-800 p-6 flex gap-3 justify-end">
                <Button
                  onClick={() => setIsFolderModalOpen(false)}
                  disabled={isSaving}
                  className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveFolder}
                  disabled={isSaving}
                  className="bg-zinc-700 border border-zinc-600 hover:bg-zinc-600 text-white"
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
      <div className="fixed bottom-6 right-6 z-[70]">
        <ActivateAIButton />
      </div>
    </AIWorkspaceShift>
  )
}
