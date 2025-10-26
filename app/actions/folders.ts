'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Folder } from '@/types'

export async function getFolders(): Promise<{ folders: Folder[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { folders: [], error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', user.id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    return { folders: [], error: error.message }
  }

  return { folders: data || [], error: null }
}

export async function createFolder(formData: FormData): Promise<{ success: boolean; error: string | null; folder?: Folder }> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  const name = formData.get('name') as string
  const color = formData.get('color') as string || '#6366f1'
  const emoji = formData.get('emoji') as string || null

  if (!name || name.trim() === '') {
    return { success: false, error: 'Folder name is required' }
  }

  // Get the maximum position
  const { data: maxPositionData } = await supabase
    .from('folders')
    .select('position')
    .eq('user_id', user.id)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const newPosition = (maxPositionData?.position ?? -1) + 1

  const { data, error } = await supabase
    .from('folders')
    .insert({
      user_id: user.id,
      name: name.trim(),
      color,
      emoji,
      position: newPosition,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/notes')
  return { success: true, error: null, folder: data }
}

export async function updateFolder(folderId: string, formData: FormData): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  const name = formData.get('name') as string
  const color = formData.get('color') as string
  const emoji = formData.get('emoji') as string || null

  if (!name || name.trim() === '') {
    return { success: false, error: 'Folder name is required' }
  }

  const { error } = await supabase
    .from('folders')
    .update({
      name: name.trim(),
      color,
      emoji,
    })
    .eq('id', folderId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/notes')
  return { success: true, error: null }
}

export async function deleteFolder(folderId: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Notes with folder_id will have folder_id set to NULL due to ON DELETE SET NULL
  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', folderId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/notes')
  return { success: true, error: null }
}

export async function reorderFolders(folderIds: string[]): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Update each folder's position
  const updates = folderIds.map((id, index) =>
    supabase
      .from('folders')
      .update({ position: index })
      .eq('id', id)
      .eq('user_id', user.id)
  )

  const results = await Promise.all(updates)
  const hasError = results.some((result) => result.error)

  if (hasError) {
    return { success: false, error: 'Failed to reorder folders' }
  }

  revalidatePath('/notes')
  return { success: true, error: null }
}

