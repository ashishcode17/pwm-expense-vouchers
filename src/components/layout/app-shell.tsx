'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  List,
  BarChart3,
  Settings,
  LogOut,
  PlusCircle,
  Users,
  Menu,
  X,
  UserCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { BrandLogo } from '@/components/brand-logo'

const allNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['admin', 'staff'] },
  { name: 'New Voucher', href: '/dashboard/vouchers/new', icon: PlusCircle, roles: ['admin', 'staff'] },
  { name: 'Profile', href: '/dashboard/profile', icon: UserCircle, roles: ['admin', 'staff'] },
  { name: 'Expense Register', href: '/dashboard/register', icon: List, roles: ['admin'] },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, roles: ['admin'] },
  { name: 'Users', href: '/dashboard/users', icon: Users, roles: ['admin'] },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['admin'] },
]

interface AppShellProps {
  children: React.ReactNode
  userName?: string
  userEmail?: string
  userRole?: string
}

export function AppShell({
  children,
  userName,
  userEmail,
  userRole = 'staff',
}: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = allNavItems.filter((item) => item.roles.includes(userRole))

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [mobileOpen])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Logged out successfully')
      router.push('/login')
      router.refresh()
    } catch {
      toast.error('Failed to logout')
    }
  }

  const sidebarContent = (
    <>
      <div className="border-b p-4 md:p-6">
        <div className="flex items-center gap-3">
          <BrandLogo variant="icon" className="h-11 w-11 shrink-0 object-contain" />
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-gray-900 md:text-lg">PWM Voucher</h1>
            <p className="text-sm text-gray-600">Expense Vouchers</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname?.startsWith(item.href + '/')) ||
            (item.href === '/dashboard' && pathname === '/dashboard')

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <div className="mb-3 space-y-1 px-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium text-gray-900">{userName || 'User'}</p>
            <Badge variant={userRole === 'admin' ? 'default' : 'secondary'} className="shrink-0 text-xs">
              {userRole === 'admin' ? 'Admin' : 'Staff'}
            </Badge>
          </div>
          <p className="truncate text-xs text-gray-500">{userEmail}</p>
        </div>
        <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </>
  )

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r bg-white md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex h-full w-[min(18rem,85vw)] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">Menu</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">{sidebarContent}</div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-white px-3 py-2.5 md:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 w-10 shrink-0 p-0"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <BrandLogo variant="icon" className="h-8 w-8 shrink-0 object-contain" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">PWM Vouchers</p>
              <p className="truncate text-xs text-gray-500">{userName || 'User'}</p>
            </div>
          </div>
          <Link href="/dashboard/vouchers/new">
            <Button size="sm" className="gap-1 px-2.5">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden xs:inline">New</span>
            </Button>
          </Link>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</main>
      </div>
    </div>
  )
}
