'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getAuthResetPasswordUrl } from '@/lib/site-url'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { BrandLogo } from '@/components/brand-logo'
import { toUserError } from '@/lib/user-error'

function isInvalidCredentials(error: unknown): boolean {
  const authError = error as { message?: string; code?: string }
  const msg = authError?.message?.toLowerCase() ?? ''
  return msg.includes('invalid login credentials') || msg.includes('invalid credentials')
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const authError = searchParams.get('error')
    if (authError === 'confirmation_failed') {
      setError(
        'Email confirmation failed. The link may have expired — sign up again or ask admin to confirm your email in Supabase.'
      )
    } else if (authError === 'auth_callback_failed') {
      setError('Sign-in link expired or invalid. Please try again.')
    } else if (authError === 'reset_failed') {
      setError(
        'Password reset link could not be verified. Request a new link and open it on the same browser/device where you clicked Forgot password. Admin: update Supabase Reset Password email template to use token_hash (see supabase/EMAIL_TEMPLATES.md).'
      )
      setShowForgotPassword(true)
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResetEmailSent(false)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast.success('Login successful!')
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Login failed', error)
      const message = toUserError(error, 'Failed to sign in')
      setError(message)
      toast.error(message)
      if (isInvalidCredentials(error)) {
        setShowForgotPassword(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      toast.error('Enter your email address first')
      return
    }

    setResetting(true)
    setError('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: getAuthResetPasswordUrl(),
      })
      if (error) throw error
      setResetEmailSent(true)
      toast.success('Password reset link sent. Check your inbox and spam folder.')
    } catch (error) {
      console.error('Password reset request failed', error)
      const message = toUserError(error, 'Could not send reset email')
      setError(message)
      toast.error(message)
    } finally {
      setResetting(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex justify-center">
          <BrandLogo className="h-28 w-28 object-contain" priority />
        </div>
        <CardTitle className="text-xl">Expense Vouchers</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="text-sm">
              {error}
            </Alert>
          )}

          {resetEmailSent && (
            <Alert className="text-sm">
              Reset link sent to <span className="font-medium">{email.trim()}</span>. Open the email
              and set a new password.
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || resetting}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {showForgotPassword && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading || resetting}
                  className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                >
                  {resetting ? 'Sending…' : 'Forgot password?'}
                </button>
              )}
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || resetting}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || resetting}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={<div className="text-sm text-gray-500">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
