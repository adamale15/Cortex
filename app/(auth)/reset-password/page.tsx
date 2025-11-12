'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { updatePassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit" 
      className="w-full h-11 bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 font-medium transition-colors" 
      disabled={pending}
    >
      {pending ? 'Updating...' : 'Update Password'}
    </Button>
  )
}

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await updatePassword(formData)
    if (result?.error) {
      setError(result.error)
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
          <p className="text-gray-400">Set your new password</p>
        </div>

        {/* Form Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <form action={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 text-sm">
                New Password
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password" className="text-gray-300 text-sm">
                Confirm New Password
              </Label>
              <Input
                id="confirm_password"
                name="confirm_password"
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
        </div>
      </div>
    </div>
  )
}

