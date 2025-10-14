import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
            Welcome to Cortex
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your AI-powered universal learning assistant that captures, organizes, and helps you learn from everything you encounter
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Sign In
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-16 text-left">
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="font-semibold text-lg mb-2">📝 Smart Notes</h3>
            <p className="text-sm text-muted-foreground">
              Create, organize, and search through your notes with AI-powered insights
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="font-semibold text-lg mb-2">🤖 AI Chat</h3>
            <p className="text-sm text-muted-foreground">
              Ask questions about your content and get instant, context-aware answers
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="font-semibold text-lg mb-2">📁 File Management</h3>
            <p className="text-sm text-muted-foreground">
              Upload and manage all your files in one secure, searchable place
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

