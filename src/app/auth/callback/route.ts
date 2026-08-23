import { type NextRequest, NextResponse } from 'next/server'
import {
  authRedirectUrl,
  createSupabaseRouteClient,
  safeNextPath,
} from '@/lib/supabase/route-handler'

/** OAuth / alternate PKCE callback */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'))
  const successUrl = authRedirectUrl(request, next)
  const failUrl = authRedirectUrl(request, '/login?error=auth_callback_failed')

  if (!code) {
    return NextResponse.redirect(failUrl)
  }

  const response = NextResponse.redirect(successUrl)
  const supabase = createSupabaseRouteClient(request, response)
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('auth/callback exchangeCodeForSession failed', error.message)
    return NextResponse.redirect(failUrl)
  }

  return response
}
