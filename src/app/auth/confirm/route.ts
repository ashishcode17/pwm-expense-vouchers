import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import {
  authRedirectUrl,
  createSupabaseRouteClient,
  safeNextPath,
} from '@/lib/supabase/route-handler'

/**
 * Handles email confirmation links from Supabase.
 * Supports PKCE (?code=) and token_hash (?token_hash=&type=) flows.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const nextParam = searchParams.get('next')
  const isRecovery = type === 'recovery'
  const next = isRecovery
    ? '/dashboard/profile?reset=1'
    : safeNextPath(nextParam)
  const successUrl = authRedirectUrl(request, next)
  const failUrl = authRedirectUrl(request, '/login?error=confirmation_failed')

  // PKCE / default Supabase email link (most common)
  if (code) {
    const response = NextResponse.redirect(successUrl)
    const supabase = createSupabaseRouteClient(request, response)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return response
    console.error('auth/confirm exchangeCodeForSession failed', error.message)
    return NextResponse.redirect(failUrl)
  }

  // Custom email template: token_hash + type
  if (token_hash && type) {
    const response = NextResponse.redirect(successUrl)
    const supabase = createSupabaseRouteClient(request, response)
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) return response

    // Some templates send type=signup; retry if type was email
    if (type === 'email') {
      const retry = await supabase.auth.verifyOtp({
        type: 'signup',
        token_hash,
      })
      if (!retry.error) return response
    }

    console.error('auth/confirm verifyOtp failed', error.message)
    return NextResponse.redirect(failUrl)
  }

  console.error('auth/confirm missing code or token_hash', searchParams.toString())
  return NextResponse.redirect(failUrl)
}
