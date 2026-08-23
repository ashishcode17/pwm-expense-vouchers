'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import toast from 'react-hot-toast'
import { toUserError } from '@/lib/user-error'

function ProfileForm() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromEmailReset = searchParams.get('reset') === '1'

  const [loading, setLoading] = useState(true)
  const [savingName, setSavingName] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        setEmail(user.email ?? '')

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single()

        if (error) throw error
        setName(profile?.name ?? '')
      } catch (error) {
        console.error('Failed to load profile', error)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('Name cannot be empty')
      return
    }

    setSavingName(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      const { error } = await supabase
        .from('profiles')
        .update({ name: trimmed })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Name updated')
      router.refresh()
    } catch (error) {
      console.error('Failed to update name', error)
      toast.error(toUserError(error, 'Failed to update name'))
    } finally {
      setSavingName(false)
    }
  }

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    setSavingPassword(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user?.email) throw new Error('Not signed in')

      if (!fromEmailReset) {
        if (!currentPassword) {
          toast.error('Enter your current password')
          return
        }
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        })
        if (signInError) throw signInError
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      if (fromEmailReset) {
        router.replace('/dashboard/profile')
      }

      toast.success('Password updated successfully')
    } catch (error) {
      console.error('Failed to update password', error)
      toast.error(toUserError(error, 'Failed to update password'))
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-gray-600">Update your name and password</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your login email</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled className="mt-2 bg-gray-50" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Display name</CardTitle>
            <CardDescription>Shown on vouchers and in the app</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveName} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={savingName}
                />
              </div>
              <Button type="submit" disabled={savingName}>
                {savingName ? 'Saving…' : 'Save name'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{fromEmailReset ? 'Set new password' : 'Change password'}</CardTitle>
            <CardDescription>
              {fromEmailReset
                ? 'You opened a reset link from your email. Choose a new password below.'
                : 'Enter your current password, then choose a new one.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {fromEmailReset && (
              <Alert className="mb-4 text-sm">
                Password reset link verified. Set your new password to finish.
              </Alert>
            )}
            <form onSubmit={savePassword} className="space-y-4">
              {!fromEmailReset && (
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={savingPassword}
                    autoComplete="current-password"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={savingPassword}
                  autoComplete="new-password"
                />
                <p className="text-xs text-gray-500">Minimum 6 characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={savingPassword}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? 'Updating…' : fromEmailReset ? 'Set password' : 'Update password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Loading profile…</div>}>
      <ProfileForm />
    </Suspense>
  )
}
