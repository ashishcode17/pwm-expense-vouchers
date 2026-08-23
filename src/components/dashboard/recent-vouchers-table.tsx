'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { softDeleteVoucher } from '@/lib/vouchers/delete-voucher'
import toast from 'react-hot-toast'

interface VoucherWithRelations {
  id: string
  voucher_number: string
  expense_date: string
  paid_to: string
  description: string
  amount: number
  payment_mode: string
  created_by: string
  category?: { name: string }
  created_by_profile?: { name: string }
}

interface RecentVouchersTableProps {
  vouchers: VoucherWithRelations[]
  isAdmin: boolean
}

export function RecentVouchersTable({ vouchers, isAdmin }: RecentVouchersTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async (voucher: VoucherWithRelations) => {
    if (
      !confirm(
        `Delete this voucher?\n\nVoucher: ${voucher.voucher_number}\nPaid To: ${voucher.paid_to}\nAmount: ₹${Number(voucher.amount).toLocaleString('en-IN')}`
      )
    ) {
      return
    }

    setDeletingId(voucher.id)
    try {
      const result = await softDeleteVoucher(supabase, voucher.id)
      if (!result.ok) throw new Error(result.message)

      toast.success('Voucher deleted successfully')
      router.refresh()
    } catch (error) {
      console.error('Error deleting voucher:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete voucher')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {vouchers.map((voucher) => (
          <div key={voucher.id} className="rounded-lg border bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{voucher.voucher_number}</p>
                <p className="text-xs text-gray-500">
                  {format(new Date(voucher.expense_date), 'dd/MM/yyyy')}
                </p>
              </div>
              <p className="shrink-0 text-base font-bold text-gray-900">
                ₹{Number(voucher.amount).toLocaleString('en-IN')}
              </p>
            </div>
            <p className="truncate text-sm text-gray-800">{voucher.paid_to}</p>
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">{voucher.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="outline">{voucher.category?.name || 'N/A'}</Badge>
              <Badge variant={voucher.payment_mode === 'Cash' ? 'default' : 'secondary'}>
                {voucher.payment_mode}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/dashboard/vouchers/${voucher.id}`}
                prefetch={true}
                onTouchStart={() => {
                  // Warm the route early on mobile
                  router.prefetch(`/dashboard/vouchers/${voucher.id}`)
                }}
              >
                <Button variant="outline" size="sm" className="gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  View
                </Button>
              </Link>
              {isAdmin && (
                <Link href={`/dashboard/vouchers/${voucher.id}/edit`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                </Link>
              )}
              {isAdmin && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(voucher)}
                  disabled={deletingId === voucher.id}
                  className="gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deletingId === voucher.id ? '...' : 'Del'}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Voucher No.</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Paid To</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Mode</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vouchers.map((voucher) => (
              <TableRow key={voucher.id}>
                <TableCell className="font-medium">{voucher.voucher_number}</TableCell>
                <TableCell>{format(new Date(voucher.expense_date), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{voucher.paid_to}</TableCell>
                <TableCell>
                  <Badge variant="outline">{voucher.category?.name || 'N/A'}</Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">{voucher.description}</TableCell>
                <TableCell className="font-semibold">
                  ₹{Number(voucher.amount).toLocaleString('en-IN')}
                </TableCell>
                <TableCell>
                  <Badge variant={voucher.payment_mode === 'Cash' ? 'default' : 'secondary'}>
                    {voucher.payment_mode}
                  </Badge>
                </TableCell>
                <TableCell>{voucher.created_by_profile?.name || 'N/A'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/vouchers/${voucher.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                    {isAdmin && (
                      <Link href={`/dashboard/vouchers/${voucher.id}/edit`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                      </Link>
                    )}
                    {isAdmin && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(voucher)}
                        disabled={deletingId === voucher.id}
                        className="gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        {deletingId === voucher.id ? '...' : 'Del'}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
