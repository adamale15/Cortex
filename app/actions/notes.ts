'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getNotes() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .order('starred', { ascending: false })
    .order('position', { ascending: true })

  if (error) {
    return { error: error.message }
  }

  return { notes }
}

export async function getNote(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: note, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { note }
}

export async function createNote(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const title = String(formData.get('title') ?? 'Untitled Note').trim()
  const content = String(formData.get('content') ?? '')
  const tagsString = String(formData.get('tags') ?? '')
  const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(Boolean) : []
  const folderId = formData.get('folder_id') as string | null

  // Get the max position for this user
  const { data: maxPosNote } = await supabase
    .from('notes')
    .select('position')
    .eq('user_id', user.id)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const position = maxPosNote ? maxPosNote.position + 1 : 0

  const { data: note, error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      folder_id: folderId || null,
      title,
      content,
      tags,
      position,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/notes')
  return { note }
}

export async function updateNote(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const title = String(formData.get('title') ?? 'Untitled Note').trim()
  const content = String(formData.get('content') ?? '')
  const tagsString = String(formData.get('tags') ?? '')
  const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(Boolean) : []
  const folderId = formData.get('folder_id') as string | null

  const { data: note, error } = await supabase
    .from('notes')
    .update({
      title,
      content,
      tags,
      folder_id: folderId || null,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/notes')
  return { note }
}

export async function deleteNote(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/notes')
  return { success: true }
}

export async function reorderNotes(noteIds: string[]) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Update each note's position
  const updates = noteIds.map((id, index) => 
    supabase
      .from('notes')
      .update({ position: index })
      .eq('id', id)
      .eq('user_id', user.id)
  )

  const results = await Promise.all(updates)
  
  const errors = results.filter(r => r.error)
  if (errors.length > 0) {
    return { error: 'Failed to reorder some notes' }
  }

  revalidatePath('/notes')
  return { success: true }
}

export async function moveNoteToFolder(noteId: string, folderId: string | null) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('notes')
    .update({ folder_id: folderId })
    .eq('id', noteId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/notes')
  return { success: true }
}

export async function toggleNoteStar(noteId: string, starred: boolean) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('notes')
    .update({ starred })
    .eq('id', noteId)
    .eq('user_id', user.id)
    .select('id, starred')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/notes')
  return { note: data }
}

