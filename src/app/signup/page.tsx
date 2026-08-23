'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getAuthConfirmUrl } from '@/lib/site-url'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { BrandLogo } from '@/components/brand-logo'
import { toUserError } from '@/lib/user-error'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setNeedsEmailConfirm(false)

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthConfirmUrl(),
          data: {
            name: name,
          },
        },
      })

      if (error) throw error

      // Email confirmation enabled → no session until link is clicked
      if (!data.session) {
        setNeedsEmailConfirm(true)
        toast.success('Check your email to confirm your account')
        return
      }

      toast.success('Account created successfully!')
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Signup failed', error)
      const message = toUserError(error, 'Failed to create account')
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (needsEmailConfirm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-2 flex justify-center">
              <BrandLogo className="h-28 w-28 object-contain" priority />
            </div>
            <CardTitle className="text-xl">Confirm your email</CardTitle>
            <CardDescription>
              We sent a confirmation link to <span className="font-medium text-gray-900">{email}</span>.
              Open that link to activate your account, then sign in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="text-sm">
              The link opens the live office site (not localhost). After confirming, you can log in
              with your email and password.
            </Alert>
            <Link href="/login" className="block">
              <Button type="button" className="w-full">
                Go to Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex justify-center">
            <BrandLogo className="h-28 w-28 object-contain" priority />
          </div>
          <CardTitle className="text-xl">Create Your Account</CardTitle>
          <CardDescription>Sign up to start creating expense vouchers</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="text-sm">
                {error}
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
              <p className="text-xs text-gray-500">Minimum 6 characters</p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>

            <div className="text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
