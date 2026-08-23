/**
 * Canonical public site URL for auth emails and redirects.
 * Prefer NEXT_PUBLIC_SITE_URL in production; never fall back to localhost there.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) {
    return explicit.replace(/\/$/, '')
  }

  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL?.trim()
  if (vercel) {
    const host = vercel.replace(/\/$/, '')
    return host.startsWith('http') ? host : `https://${host}`
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }

  // Production default for this app
  return 'https://vouchers.propertywithmanish.com'
}

export function getAuthConfirmUrl(): string {
  // Same handler supports PKCE ?code= and ?token_hash= flows
  return `${getSiteUrl()}/auth/confirm`
}

export function getAuthCallbackUrl(): string {
  return `${getSiteUrl()}/auth/callback`
}

export function getAuthResetPasswordUrl(): string {
  return `${getSiteUrl()}/auth/reset-password`
}
