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
    // Provide user-friendly error messages
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Invalid email or password. Please check your credentials and try again.' }
    }
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const firstName = String(formData.get('first_name') ?? '').trim()
  const lastName = String(formData.get('last_name') ?? '').trim()
  const fullName = `${firstName} ${lastName}`.trim()

  const data = {
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
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
  redirect('/')
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  
  const email = String(formData.get('email') ?? '').trim().toLowerCase()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })

  if (error) {
    // Handle specific errors
    if (error.message.includes('User not found') || error.message.includes('not found')) {
      return { error: 'This email address is not registered. Please check your email or sign up for a new account.' }
    }
    return { error: error.message }
  }

  return { 
    success: true,
    message: 'Password reset link sent! Check your email inbox.' 
  }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirm_password') ?? '')

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match. Please try again.' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' }
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

