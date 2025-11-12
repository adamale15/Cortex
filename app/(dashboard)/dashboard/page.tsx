import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileText, Upload, Bell, MessageSquare } from 'lucide-react'
import { ActivateAIButton } from '@/components/ai/activate-ai-button'
import { AIWorkspaceShift } from '@/components/ai/ai-workspace-shift'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Minimal dashboard - no cards grid

  return (
    <AIWorkspaceShift>
      <div className="relative min-h-screen bg-black">
        {/* Soft background glow like homepage */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute left-1/2 top-24 h-96 w-96 -translate-x-1/2 rounded-[28px] bg-gradient-to-br from-indigo-800/40 via-zinc-900 to-sky-800/30 blur-3xl opacity-70" />
        </div>
        {/* Navigation */}
        <Navbar />
        
        {/* Header */}
        <header className="bg-transparent relative z-10">
          <div className="w-full max-w-[95%] mx-auto px-4 md:px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-semibold text-white">Dashboard</h1>
                <p className="text-zinc-400 mt-2">
                  Welcome back, {user?.email}
                </p>
              </div>
            <form action={signOut}>
              <Button
                type="submit"
              >
                Sign Out
              </Button>
            </form>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 w-full max-w-[95%] mx-auto px-4 md:px-6 py-8">
          {/* Welcome Card only */}
          <div className="max-w-4xl mx-auto bg-zinc-950/60 border border-zinc-800 rounded-2xl p-8 backdrop-blur">
            <div className="flex items-start gap-4">
              <div className="text-5xl">🎉</div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-white mb-2">
                  Welcome to Cortex!
                </h2>
                <p className="text-zinc-400 mb-6">
                  Your AI-powered learning assistant is ready. Here's what you can do:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium mb-1">Create Notes</h3>
                      <p className="text-zinc-500 text-sm">Write and organize your thoughts with our rich text editor</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Upload className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium mb-1">Upload Files</h3>
                      <p className="text-zinc-500 text-sm">Store and manage your documents in one place</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bell className="h-4 w-4 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium mb-1">Set Reminders</h3>
                      <p className="text-zinc-500 text-sm">Never miss important tasks or deadlines</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MessageSquare className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium mb-1">AI Chat</h3>
                      <p className="text-zinc-500 text-sm">Get help and insights from AI about your content</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Link href="/notes">
                    <Button>
                      <FileText className="h-4 w-4 mr-2" />
                      Create Note
                    </Button>
                  </Link>
                  <Link href="/files">
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <div className="fixed bottom-6 right-6 z-[70]">
        <ActivateAIButton />
      </div>
    </AIWorkspaceShift>
  )
}


