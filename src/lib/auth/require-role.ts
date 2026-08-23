import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, role, active')
    .eq('id', user.id)
    .single()

  if (profile && profile.active === false) {
    await supabase.auth.signOut()
    redirect('/login?error=account_disabled')
  }

  return { supabase, user, profile }
}

export async function requireAdmin() {
  const ctx = await requireUser()
  if (ctx.profile?.role !== 'admin') {
    redirect('/dashboard')
  }
  return ctx
}
