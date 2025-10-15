'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { resetPassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

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
          Sending...
        </>
      ) : (
        'Send Reset Link'
      )}
    </Button>
  )
}

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(null)
    
    const result = await resetPassword(formData)
    
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setSuccess(result.message || 'Password reset link sent!')
    }
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-2 pb-6">
        <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
          Reset Password
        </CardTitle>
        <CardDescription className="text-center text-base">
          Enter your email to receive a password reset link
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        {success ? (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Check Your Email</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  We've sent a password reset link to your email address. Click the link to reset your password.
                </p>
              </div>
            </div>
            <div className="text-xs text-center text-muted-foreground pt-4 border-t">
              Didn't receive it? Check your spam folder or try again in a few minutes.
            </div>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="h-11"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-3 rounded-lg">
                <span className="font-medium">Error:</span> {error}
              </div>
            )}
            <SubmitButton />
          </form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 pt-6 border-t">
        <div className="text-sm text-center text-muted-foreground">
          Remember your password?{' '}
          <Link href="/login" className="text-primary hover:underline font-semibold transition-colors">
            Back to sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}

