/**
 * Map Auth / PostgREST / storage errors to safe user-facing copy.
 * Log the real error server-side or in console for debugging.
 */
export function toUserError(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof (error as { message: unknown }).message === 'string'
        ? (error as { message: string }).message
        : ''

  const msg = raw.toLowerCase()

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
    return 'Too many attempts. Please wait and try again'
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

  // Never pass raw PostgREST/Auth/schema text to the UI
  if (raw && raw.length < 80 && !/[/{}\[\]<>]/.test(raw) && !msg.includes('postgres')) {
    // Allow short known-safe Auth messages only via mappings above
  }

  return fallback
}
