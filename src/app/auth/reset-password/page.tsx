'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand-logo'
import { toUserError } from '@/lib/user-error'

function ResetPasswordHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const completeReset = async () => {
      const token_hash = searchParams.get('token_hash')
      const type = searchParams.get('type')
      const code = searchParams.get('code')

      try {
        // Preferred: token_hash works on any browser/device (mobile email apps)
        if (token_hash) {
          const otpType = type === 'recovery' ? 'recovery' : type === 'email' ? 'email' : 'recovery'
          const { error: verifyError } = await supabase.auth.verifyOtp({
            type: otpType,
            token_hash,
          })
          if (verifyError) throw verifyError
          if (!cancelled) router.replace('/dashboard/profile?reset=1')
          return
        }

        // Fallback: PKCE code only works in the same browser that requested reset
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            throw new Error(
              'This reset link must be opened in the same browser where you clicked Forgot password. Request a new link and open the email on that same device/browser.'
            )
          }
          if (!cancelled) router.replace('/dashboard/profile?reset=1')
          return
        }

        throw new Error('Reset link is missing required information.')
      } catch (err) {
        console.error('Password reset link failed', err)
        if (!cancelled) {
          setError(toUserError(err, 'Password reset link expired or invalid'))
        }
      }
    }

    completeReset()

    return () => {
      cancelled = true
    }
  }, [router, searchParams, supabase.auth])

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex justify-center">
            <BrandLogo className="h-20 w-20 object-contain" priority />
          </div>
          <CardTitle className="text-xl">Reset link problem</CardTitle>
          <CardDescription>We could not verify this password reset link</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive" className="text-sm">
            {error}
          </Alert>
          <Alert className="text-sm">
            Tip: Request reset again and open the email on the <strong>same phone/browser</strong>{' '}
            where you clicked Forgot password. Or ask admin to update the Supabase Reset Password
            email template (token_hash link).
          </Alert>
          <Link href="/login" className="block">
            <Button className="w-full">Back to Sign In</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex justify-center">
          <BrandLogo className="h-20 w-20 object-contain" priority />
        </div>
        <CardTitle className="text-xl">Verifying reset link…</CardTitle>
        <CardDescription>Please wait a moment</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center text-sm text-gray-500">Setting up password reset</p>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={<div className="text-sm text-gray-500">Loading…</div>}>
        <ResetPasswordHandler />
      </Suspense>
    </div>
  )
}
