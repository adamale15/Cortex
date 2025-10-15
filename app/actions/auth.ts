'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  const data = { email, password }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const fullName = String(formData.get('full_name') ?? '').trim()

  const data = {
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  }

  const { error, data: signUpData } = await supabase.auth.signUp(data)

  if (error) {
    // Handle specific error messages with user-friendly text
    if (error.message.toLowerCase().includes('already registered') || 
        error.message.toLowerCase().includes('already exists') ||
        error.message.toLowerCase().includes('user already registered')) {
      return { error: 'You already have an account with this email. Please sign in instead.' }
    }
    if (error.message.toLowerCase().includes('invalid')) {
      return { error: 'This email address is already registered. Please sign in instead.' }
    }
    return { error: error.message }
  }

  // If user already exists, Supabase returns success but no session
  if (signUpData.user && !signUpData.session && signUpData.user.identities?.length === 0) {
    return { error: 'You already have an account with this email. Please sign in instead.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

