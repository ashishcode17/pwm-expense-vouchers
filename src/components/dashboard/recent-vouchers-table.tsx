'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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
  currentUserId: string
}

export function RecentVouchersTable({ vouchers, isAdmin, currentUserId }: RecentVouchersTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async (voucher: VoucherWithRelations) => {
    if (!confirm(`Delete this voucher?\n\nVoucher: ${voucher.voucher_number}\nPaid To: ${voucher.paid_to}\nAmount: ₹${Number(voucher.amount).toLocaleString('en-IN')}`)) {
      return
    }

    setDeletingId(voucher.id)
    try {
      const { error } = await supabase
        .from('vouchers')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', voucher.id)

      if (error) throw error

      toast.success('Voucher deleted successfully')
      router.refresh()
    } catch (error) {
      console.error('Error deleting voucher:', error)
      toast.error('Failed to delete voucher')
    } finally {
      setDeletingId(null)
    }
  }

  const canEdit = (voucher: VoucherWithRelations) => {
    return isAdmin || voucher.created_by === currentUserId
  }

  return (
    <div className="overflow-x-auto">
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
              <TableCell className="font-semibold">₹{Number(voucher.amount).toLocaleString('en-IN')}</TableCell>
              <TableCell>
                <Badge variant={voucher.payment_mode === 'Cash' ? 'default' : 'secondary'}>
                  {voucher.payment_mode}
                </Badge>
              </TableCell>
              <TableCell>{voucher.created_by_profile?.name || 'N/A'}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/vouchers/${voucher.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                  {canEdit(voucher) && (
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
  )
}
