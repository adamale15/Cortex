import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions/auth'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Show minimal homepage even if logged in; no redirect

  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      <div className="absolute inset-0">
        <Image
          src="/background.png"
          alt=""
          fill
          priority
          quality={100}
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" aria-hidden="true" />

      {/* soft background glow + decorative svgs */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-1/2 top-24 h-96 w-96 -translate-x-1/2 rounded-[28px] bg-gradient-to-br from-indigo-800/40 via-zinc-900 to-sky-800/30 blur-3xl opacity-70" />
      </div>

      <div className="relative z-10 container mx-auto px-6 md:px-8 py-24 md:py-32 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 mb-8">
            <span className="text-white font-semibold">C</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-white">
            Cortex makes your knowledge unforgettable
          </h1>
          <p className="mt-6 text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto">
            Capture notes, organize folders, and search instantly. A focused workspace—no clutter, just flow.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button size="lg" className="px-8 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white">Go to Dashboard</Button>
                </Link>
                <form action={signOut}>
                  <Button type="submit" size="lg" className="px-8 rounded-full bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800">Sign Out</Button>
                </form>
              </>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="px-8 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white">Get Started</Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="px-8 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white">Sign In</Button>
                </Link>
              </>
            )}
          </div>
            
          <div className="mt-24 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-4 text-left">
              <p className="text-sm text-zinc-400">Notes</p>
              <p className="mt-1 text-zinc-500 text-sm">Write, edit, and organize.</p>
            </div>
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-4 text-left">
              <p className="text-sm text-zinc-400">Search</p>
              <p className="mt-1 text-zinc-500 text-sm">Find anything instantly.</p>
            </div>
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-4 text-left">
              <p className="text-sm text-zinc-400">Focus</p>
              <p className="mt-1 text-zinc-500 text-sm">Minimal, distraction‑free.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

