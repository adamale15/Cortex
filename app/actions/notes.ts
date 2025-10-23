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
    .order('updated_at', { ascending: false })

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

  const { data: note, error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      title,
      content,
      tags,
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

  const { data: note, error } = await supabase
    .from('notes')
    .update({
      title,
      content,
      tags,
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

