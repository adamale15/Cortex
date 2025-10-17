'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { signup, signInWithGoogle } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit" 
      className="w-full h-11 bg-white text-black hover:bg-gray-100 font-medium transition-colors" 
      disabled={pending}
    >
      {pending ? 'Creating account...' : 'Create Account'}
    </Button>
  )
}

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await signup(formData)
    if (result?.error) {
      setError(result.error)
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError('Failed to sign in with Google')
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-white mb-2">Cortex</h1>
          </Link>
          <p className="text-gray-400">Create your account</p>
        </div>

        {/* Form Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <form action={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-gray-300 text-sm">
                  First Name
                </Label>
                <Input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  autoComplete="given-name"
                  className="bg-black border-zinc-800 text-white h-11 focus:border-white transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-gray-300 text-sm">
                  Last Name
                </Label>
                <Input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  autoComplete="family-name"
                  className="bg-black border-zinc-800 text-white h-11 focus:border-white transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 text-sm">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="bg-black border-zinc-800 text-white h-11 focus:border-white transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 text-sm">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                className="bg-black border-zinc-800 text-white h-11 focus:border-white transition-colors"
              />
              <p className="text-xs text-gray-500">Must be at least 6 characters</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <SubmitButton />
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-white hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-zinc-900 text-gray-400">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full h-12 bg-transparent border-zinc-800 text-white hover:bg-zinc-800 mt-4"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}


