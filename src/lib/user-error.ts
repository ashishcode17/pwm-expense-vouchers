/**
 * Map Auth / PostgREST / storage errors to safe user-facing copy.
 */
export function toUserError(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  const authError = error as { message?: string; code?: string; status?: number }
  const code = authError?.code?.toLowerCase() ?? ''
  const raw = authError?.message ?? (error instanceof Error ? error.message : '')
  const msg = raw.toLowerCase()

  if (code === 'over_email_send_rate_limit' || msg.includes('email rate limit exceeded')) {
    return 'Email limit reached (Supabase default: 2/hour). Admin must set up custom SMTP in Supabase, then try again in 1 hour.'
  }
  if (code === 'email_address_not_authorized' || msg.includes('not authorized')) {
    return 'This email cannot receive mail on Supabase free built-in SMTP. Admin must configure custom SMTP (Resend/SendGrid).'
  }
  if (code === 'signup_disabled' || msg.includes('signup is disabled')) {
    return 'New signups are disabled. Contact your admin.'
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Invalid email or password'
  }
  if (msg.includes('email not confirmed')) {
    return 'Please confirm your email before signing in'
  }
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return 'An account with this email already exists'
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Too many attempts. Please wait and try again.'
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Network error. Check your connection and try again'
  }
  if (msg.includes('row-level security') || msg.includes('rls') || msg.includes('permission')) {
    return 'You do not have permission to do that'
  }
  if (msg.includes('duplicate') || msg.includes('unique')) {
    return 'That value already exists'
  }

  return fallback
}
