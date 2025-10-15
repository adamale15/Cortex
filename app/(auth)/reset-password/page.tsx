'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { updatePassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit" 
      className="w-full h-11 text-base font-semibold" 
      disabled={pending}
    >
      {pending ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Updating...
        </>
      ) : (
        'Update Password'
      )}
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
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-2 pb-6">
        <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
          Set New Password
        </CardTitle>
        <CardDescription className="text-center text-base">
          Choose a strong password for your account
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <form action={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              New Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter new password"
              required
              autoComplete="new-password"
              minLength={6}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password" className="text-sm font-medium">
              Confirm New Password
            </Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              placeholder="Confirm new password"
              required
              autoComplete="new-password"
              minLength={6}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 6 characters long
            </p>
          </div>
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-3 rounded-lg">
              <span className="font-medium">Error:</span> {error}
            </div>
          )}
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}

