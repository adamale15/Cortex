'use client'

import { useState, useEffect } from 'react'
import { Note } from '@/types'
import { getNotes, createNote, updateNote, deleteNote } from '@/app/actions/notes'
import { Editor } from '@/components/notes/editor'
import { NoteCard } from '@/components/notes/note-card'
import { Navbar } from '@/components/navbar'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Search, X } from 'lucide-react'
import { signOut } from '@/app/actions/auth'

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; noteId: string | null }>({
    isOpen: false,
    noteId: null,
  })

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    setLoading(true)
    const result = await getNotes()
    if (result.notes) {
      setNotes(result.notes)
    }
    setLoading(false)
  }

  const handleCreateNew = () => {
    setEditingNote(null)
    setFormData({ title: '', content: '', tags: '' })
    setIsModalOpen(true)
    setError(null)
  }

  const handleEdit = (note: Note) => {
    setEditingNote(note)
    setFormData({
      title: note.title,
      content: note.content,
      tags: note.tags?.join(', ') || '',
    })
    setIsModalOpen(true)
    setError(null)
  }

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, noteId: id })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.noteId) return
    
    const result = await deleteNote(deleteConfirm.noteId)
    if (result.success) {
      // Reload notes to get fresh data from the database
      await loadNotes()
    } else if (result.error) {
      alert(result.error)
    }
    
    setDeleteConfirm({ isOpen: false, noteId: null })
  }

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, noteId: null })
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Please enter a title')
      return
    }

    setIsSaving(true)
    setError(null)

    const data = new FormData()
    data.append('title', formData.title)
    data.append('content', formData.content)
    data.append('tags', formData.tags)

    const result = editingNote
      ? await updateNote(editingNote.id, data)
      : await createNote(data)

    setIsSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    if (result.note) {
      // Reload notes to get fresh data from the database
      await loadNotes()
      setIsModalOpen(false)
    }
  }

  const filteredNotes = notes.filter(note => {
    const query = searchQuery.toLowerCase()
    return (
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  })

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <Navbar />
      
      {/* Header */}
      <header className="border-b border-zinc-800 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Notes</h1>
              <p className="text-sm text-gray-400 mt-1">
                {notes.length} {notes.length === 1 ? 'note' : 'notes'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleCreateNew}
                className="bg-white text-black hover:bg-gray-100 font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
              <form action={signOut}>
                <Button
                  type="submit"
                  className="bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800 font-medium"
                >
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-800 text-white h-12 focus:border-white"
            />
          </div>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400">Loading notes...</div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first note to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreateNew} className="bg-white text-black hover:bg-gray-100">
                <Plus className="h-4 w-4 mr-2" />
                Create Note
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white">
                {editingNote ? 'Edit Note' : 'New Note'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-300">
                  Title
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter note title..."
                  className="bg-black border-zinc-800 text-white h-11 focus:border-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-gray-300">
                  Content
                </Label>
                <Editor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  placeholder="Start writing your note..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags" className="text-gray-300">
                  Tags (comma-separated)
                </Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="work, personal, ideas..."
                  className="bg-black border-zinc-800 text-white h-11 focus:border-white"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800">
              <Button
                onClick={() => setIsModalOpen(false)}
                variant="outline"
                className="border-zinc-800 text-gray-300 hover:bg-zinc-800 hover:text-white"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-white text-black hover:bg-gray-100"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : editingNote ? 'Save Changes' : 'Create Note'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  )
}

