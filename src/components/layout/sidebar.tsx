'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, List, BarChart3, Settings, LogOut, PlusCircle, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

const allNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['admin', 'staff'] },
  { name: 'New Voucher', href: '/dashboard/vouchers/new', icon: PlusCircle, roles: ['admin', 'staff'] },
  { name: 'Expense Register', href: '/dashboard/register', icon: List, roles: ['admin'] },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, roles: ['admin'] },
  { name: 'Users', href: '/dashboard/users', icon: Users, roles: ['admin'] },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['admin'] },
]

interface SidebarProps {
  userName?: string
  userEmail?: string
  userRole?: string
}

export function Sidebar({ userName, userEmail, userRole = 'staff' }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

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

  // Filter nav items based on user role
  const navItems = allNavItems.filter(item => item.roles.includes(userRole))

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-white">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-gray-900">Property With Manish</h1>
        <p className="text-sm text-gray-600">Expense Vouchers</p>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      
      <div className="border-t p-4">
        <div className="mb-3 px-3 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">{userName || 'User'}</p>
            <Badge variant={userRole === 'admin' ? 'default' : 'secondary'} className="text-xs">
              {userRole === 'admin' ? 'Admin' : 'Staff'}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 truncate">{userEmail}</p>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
