'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format } from 'date-fns'
import { Download, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Voucher, ExpenseCategory, Employee } from '@/lib/types'

function escapeIlike(value: string): string {
  return value.replace(/[%_,.()\\]/g, '').trim().slice(0, 80)
}

function csvCell(value: string | number): string {
  let s = String(value ?? '')
  if (/^[=+\-@]/.test(s)) s = `'${s}`
  if (/[",\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
  return s
}

export default function ExpenseRegisterPage() {
  const supabase = createClient()
  
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const dropdownsLoaded = useRef(false)
  
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    category: '',
    paymentMode: '',
    paidBy: '',
    search: '',
  })
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(escapeIlike(filters.search)), 300)
    return () => clearTimeout(t)
  }, [filters.search])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('vouchers')
        .select(`
          id,
          voucher_number,
          expense_date,
          paid_to,
          description,
          payment_mode,
          amount,
          category:expense_categories(name),
          paid_by_employee:employees!vouchers_paid_by_fkey(name),
          approved_by_employee:employees!vouchers_approved_by_fkey(name)
        `)
        .is('deleted_at', null)
        .order('expense_date', { ascending: false })
        .limit(500)

      if (filters.dateFrom) {
        query = query.gte('expense_date', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('expense_date', filters.dateTo)
      }
      if (filters.category) {
        query = query.eq('category_id', filters.category)
      }
      if (filters.paymentMode) {
        const allowed = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'] as const
        if ((allowed as readonly string[]).includes(filters.paymentMode)) {
          query = query.eq('payment_mode', filters.paymentMode)
        }
      }
      if (filters.paidBy) {
        query = query.eq('paid_by', filters.paidBy)
      }
      if (debouncedSearch) {
        const q = debouncedSearch
        query = query.or(`voucher_number.ilike.%${q}%,paid_to.ilike.%${q}%,description.ilike.%${q}%`)
      }

      const { data, error } = await query
      if (error) throw error
      setVouchers((data as unknown as Voucher[]) || [])

      if (!dropdownsLoaded.current) {
        const [categoriesRes, employeesRes] = await Promise.all([
          supabase.from('expense_categories').select('*').eq('active', true).order('name'),
          supabase.from('employees').select('*').eq('active', true).order('name'),
        ])
        if (categoriesRes.data) setCategories(categoriesRes.data)
        if (employeesRes.data) setEmployees(employeesRes.data)
        dropdownsLoaded.current = true
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [
    debouncedSearch,
    filters.category,
    filters.dateFrom,
    filters.dateTo,
    filters.paidBy,
    filters.paymentMode,
    supabase,
  ])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  const totalExpense = vouchers.reduce((sum, v) => sum + Number(v.amount), 0)

  const setQuickFilter = (type: string) => {
    const today = new Date().toISOString().split('T')[0]
    const thisWeekStart = new Date()
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())
    const weekStart = thisWeekStart.toISOString().split('T')[0]
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    switch (type) {
      case 'today':
        setFilters({ ...filters, dateFrom: today, dateTo: today })
        break
      case 'week':
        setFilters({ ...filters, dateFrom: weekStart, dateTo: today })
        break
      case 'month':
        setFilters({ ...filters, dateFrom: monthStart, dateTo: today })
        break
      case 'all':
        setFilters({ ...filters, dateFrom: '', dateTo: '' })
        break
    }
  }

  const exportToCSV = () => {
    try {
      const headers = ['Date', 'Voucher No', 'Category', 'Paid To', 'Description', 'Payment Mode', 'Amount', 'Paid By', 'Approved By']
      const rows = vouchers.map(v => [
        format(new Date(v.expense_date), 'dd/MM/yyyy'),
        v.voucher_number,
        v.category?.name || '',
        v.paid_to,
        v.description,
        v.payment_mode,
        Number(v.amount).toFixed(2),
        v.paid_by_employee?.name || '',
        v.approved_by_employee?.name || '',
      ])

      const csv = [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `PWM-Expense-Register-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Exported to CSV')
    } catch (error) {
      console.error('Error exporting:', error)
      toast.error('Failed to export')
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Expense Register</h1>
        <p className="mt-1 text-gray-600">View and filter all expenses</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setQuickFilter('today')}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickFilter('week')}>
                This Week
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickFilter('month')}>
                This Month
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickFilter('all')}>
                All Time
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium">Date From</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Date To</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Payment Mode</label>
                <select
                  value={filters.paymentMode}
                  onChange={(e) => setFilters({ ...filters, paymentMode: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Modes</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Paid By</label>
                <select
                  value={filters.paidBy}
                  onChange={(e) => setFilters({ ...filters, paidBy: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">All</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by voucher number, paid to, or description..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Expense List</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Total: <span className="font-bold text-lg">₹{totalExpense.toLocaleString('en-IN')}</span>
            </p>
          </div>
          <Button onClick={exportToCSV} className="gap-2" disabled={vouchers.length === 0}>
            <Download className="h-4 w-4" />
            Export to CSV
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No expenses found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Voucher No</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Paid To</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Paid By</TableHead>
                    <TableHead>Approved By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.map((voucher) => (
                    <TableRow key={voucher.id}>
                      <TableCell>{format(new Date(voucher.expense_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="font-medium">{voucher.voucher_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{voucher.category?.name || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>{voucher.paid_to}</TableCell>
                      <TableCell className="max-w-xs truncate">{voucher.description}</TableCell>
                      <TableCell>
                        <Badge variant={voucher.payment_mode === 'Cash' ? 'default' : 'secondary'}>
                          {voucher.payment_mode}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">₹{Number(voucher.amount).toLocaleString('en-IN')}</TableCell>
                      <TableCell>{voucher.paid_by_employee?.name || '-'}</TableCell>
                      <TableCell>{voucher.approved_by_employee?.name || '-'}</TableCell>
                      <TableCell>
                        <Link href={`/dashboard/vouchers/${voucher.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
