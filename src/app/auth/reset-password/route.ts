import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import {
  authRedirectUrl,
  createSupabaseRouteClient,
} from '@/lib/supabase/route-handler'

/** Password recovery links from Supabase email → session → profile reset form */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const successUrl = authRedirectUrl(request, '/dashboard/profile?reset=1')
  const failUrl = authRedirectUrl(request, '/login?error=reset_failed')

  if (code) {
    const response = NextResponse.redirect(successUrl)
    const supabase = createSupabaseRouteClient(request, response)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return response
    console.error('auth/reset-password exchangeCodeForSession failed', error.message)
    return NextResponse.redirect(failUrl)
  }

  if (token_hash && type === 'recovery') {
    const response = NextResponse.redirect(successUrl)
    const supabase = createSupabaseRouteClient(request, response)
    const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash })
    if (!error) return response
    console.error('auth/reset-password verifyOtp failed', error.message)
    return NextResponse.redirect(failUrl)
  }

  console.error('auth/reset-password missing code or token_hash', searchParams.toString())
  return NextResponse.redirect(failUrl)
}
