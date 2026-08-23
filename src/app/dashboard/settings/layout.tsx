import { requireAdmin } from '@/lib/auth/require-role'

export default async function AdminOnlyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()
  return children
}
