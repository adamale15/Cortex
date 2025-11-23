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
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/cortex.png"
          alt=""
          fill
          priority
          quality={100}
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <div className="relative z-10 container mx-auto px-6 md:px-8 py-24 md:py-32 text-zinc-900">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 mb-8">
            <span className="text-white font-semibold">C</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-zinc-900">
            Cortex makes your knowledge unforgettable
          </h1>
          <p className="mt-6 text-lg md:text-xl text-zinc-600 max-w-3xl mx-auto">
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
                  <Button size="lg" className="group px-8 rounded-full bg-zinc-900 text-white">Get Started</Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="px-8 rounded-full border-zinc-900 text-white hover:bg-zinc-100">Sign In</Button>
                </Link>
              </>
            )}
          </div>
            

        </div>
      </div>
    </main>
  )
}

