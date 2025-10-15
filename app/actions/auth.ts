'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  // Check if email exists in profiles (using service role to bypass RLS)
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', email)
    .maybeSingle()

  if (!existingUser) {
    return { 
      error: 'This email address is not registered. Please sign up first or check your email for typos.' 
    }
  }

  const data = { email, password }

  const { error, data: signInData } = await supabase.auth.signInWithPassword(data)

  if (error) {
    // If email exists but login fails, it's likely wrong password
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Incorrect password. Please try again or reset your password.' }
    }
    return { error: error.message }
  }

  // Check if email is confirmed
  if (signInData.user && !signInData.user.email_confirmed_at) {
    await supabase.auth.signOut()
    return { 
      error: 'Please confirm your email address before signing in. Check your inbox for the confirmation link.' 
    }
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

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  
  const email = String(formData.get('email') ?? '').trim().toLowerCase()

  // Check if email exists in profiles
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', email)
    .maybeSingle()

  if (!existingUser) {
    return { 
      error: 'This email address is not registered. Please check your email or sign up for a new account.' 
    }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })

  if (error) {
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

