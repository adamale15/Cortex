'use server'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  }

  const supabase = await createClient()
  await supabase.auth.signOut()

  return NextResponse.json({ success: true })
}

