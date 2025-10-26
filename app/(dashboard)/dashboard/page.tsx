import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileText, Upload, Bell, MessageSquare, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch counts
  const { count: notesCount } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true })
  
  const { count: filesCount } = await supabase
    .from('files')
    .select('*', { count: 'exact', head: true })
  
  const { count: remindersCount } = await supabase
    .from('reminders')
    .select('*', { count: 'exact', head: true })

  const features = [
    {
      title: 'Notes',
      description: 'Create and organize your notes',
      icon: FileText,
      count: notesCount || 0,
      href: '/notes',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Files',
      description: 'Upload and manage files',
      icon: Upload,
      count: filesCount || 0,
      href: '/files',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Reminders',
      description: 'Set up reminders',
      icon: Bell,
      count: remindersCount || 0,
      href: '/reminders',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      title: 'AI Chat',
      description: 'Chat with AI assistant',
      icon: MessageSquare,
      count: 0,
      href: '/chat',
      gradient: 'from-green-500 to-emerald-500',
    },
  ]

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <Navbar />
      
      {/* Header */}
      <header className="border-b border-zinc-800 bg-black">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-gray-400 mt-1">
                Welcome back, {user?.email}
              </p>
            </div>
            <form action={signOut}>
              <Button
                type="submit"
                className="border-zinc-800 text-gray-300 hover:bg-zinc-800 hover:text-white"
              >
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Link
                key={feature.title}
                href={feature.href}
                className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all duration-300 overflow-hidden"
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <div className="relative">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-2 flex items-center justify-between">
                    {feature.title}
                    <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </h3>
                  
                  <p className="text-gray-400 text-sm mb-4">
                    {feature.description}
                  </p>
                  
                  <div className="text-3xl font-bold text-white">
                    {feature.count}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <div className="text-5xl">🎉</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome to Cortex!
              </h2>
              <p className="text-gray-400 mb-6">
                Your AI-powered learning assistant is ready. Here's what you can do:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Create Notes</h3>
                    <p className="text-gray-500 text-sm">Write and organize your thoughts with our rich text editor</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Upload className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Upload Files</h3>
                    <p className="text-gray-500 text-sm">Store and manage your documents in one place</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell className="h-4 w-4 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Set Reminders</h3>
                    <p className="text-gray-500 text-sm">Never miss important tasks or deadlines</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageSquare className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">AI Chat</h3>
                    <p className="text-gray-500 text-sm">Get help and insights from AI about your content</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Link href="/notes">
                  <Button className="bg-white text-black hover:bg-gray-100">
                    <FileText className="h-4 w-4 mr-2" />
                    Create Note
                  </Button>
                </Link>
                <Link href="/files">
                  <Button className="border-zinc-800 text-gray-300 hover:bg-zinc-800 hover:text-white">
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
  )
}


