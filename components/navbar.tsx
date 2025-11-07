'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Upload, Bell, MessageSquare, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Notes', href: '/notes', icon: FileText },
  { name: 'Files', href: '/files', icon: Upload },
  { name: 'Reminders', href: '/reminders', icon: Bell },
  { name: 'AI Chat', href: '/chat', icon: MessageSquare },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 py-4 px-4 md:px-6">
      <div className="w-full max-w-[95%] mx-auto">
        <div className="bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-2xl px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-bold text-white group-hover:text-gray-300 transition-colors">
              Cortex
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-zinc-800 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-zinc-800/50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <LayoutDashboard className="h-6 w-6" />
            </Link>
          </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden pb-3 flex gap-2 overflow-x-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                    isActive
                      ? 'bg-zinc-800 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-zinc-800/50'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

