import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Supabase client for Route Handlers — session cookies must be written
 * onto the same NextResponse that is returned (redirect).
 */
export function createSupabaseRouteClient(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )
}

export function safeNextPath(nextParam: string | null): string {
  if (!nextParam || !nextParam.startsWith('/') || nextParam.startsWith('//') || nextParam.includes('\\')) {
    return '/dashboard'
  }
  if (!/^\/(dashboard|login)(\/|$)/.test(nextParam)) {
    return '/dashboard'
  }
  return nextParam
}

export function authRedirectUrl(request: NextRequest, path: string): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (site) return `${site}${path}`

  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}${path}`
  }

  const { origin } = new URL(request.url)
  return `${origin}${path}`
}
