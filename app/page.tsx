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
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-black">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-3xl">C</span>
          </div>
          <h1 className="text-6xl font-bold text-white">
            Welcome to Cortex
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Your AI-powered universal learning assistant that captures, organizes, and helps you learn from everything you encounter
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8 bg-white text-black hover:bg-gray-100">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-lg px-8 border-zinc-800 text-gray-300 hover:bg-zinc-800 hover:text-white">
              Sign In
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-16 text-left">
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900">
            <h3 className="font-semibold text-lg mb-2 text-white">📝 Smart Notes</h3>
            <p className="text-sm text-gray-400">
              Create, organize, and search through your notes with AI-powered insights
            </p>
          </div>
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900">
            <h3 className="font-semibold text-lg mb-2 text-white">🤖 AI Chat</h3>
            <p className="text-sm text-gray-400">
              Ask questions about your content and get instant, context-aware answers
            </p>
          </div>
          <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900">
            <h3 className="font-semibold text-lg mb-2 text-white">📁 File Management</h3>
            <p className="text-sm text-gray-400">
              Upload and manage all your files in one secure, searchable place
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

