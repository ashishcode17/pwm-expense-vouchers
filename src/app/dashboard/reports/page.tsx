'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'

interface CategoryBreakdown {
  name: string
  amount: number
}

interface ReportStats {
  totalExpenses: number
  categoryBreakdown: CategoryBreakdown[]
  paymentModeBreakdown: CategoryBreakdown[]
}

export default function ReportsPage() {
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [stats, setStats] = useState<ReportStats>({
    totalExpenses: 0,
    categoryBreakdown: [],
    paymentModeBreakdown: [],
  })

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const [year, month] = selectedMonth.split('-')
      const firstDay = `${year}-${month}-01`
      const lastDay = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]

      const { data: vouchers } = await supabase
        .from('vouchers')
        .select(`
          *,
          category:expense_categories(name)
        `)
        .gte('expense_date', firstDay)
        .lte('expense_date', lastDay)
        .is('deleted_at', null)

      if (!vouchers) {
        setStats({ totalExpenses: 0, categoryBreakdown: [], paymentModeBreakdown: [] })
        return
      }

      const totalExpenses = vouchers.reduce((sum, v) => sum + Number(v.amount), 0)

      // Category breakdown
      const categoryMap = new Map<string, number>()
      vouchers.forEach(v => {
        const category = v.category?.name || 'Uncategorized'
        categoryMap.set(category, (categoryMap.get(category) || 0) + Number(v.amount))
      })
      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)

      // Payment mode breakdown
      const paymentMap = new Map<string, number>()
      vouchers.forEach(v => {
        const mode = v.payment_mode
        paymentMap.set(mode, (paymentMap.get(mode) || 0) + Number(v.amount))
      })
      const paymentModeBreakdown = Array.from(paymentMap.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)

      setStats({
        totalExpenses,
        categoryBreakdown,
        paymentModeBreakdown,
      })
    } catch (error) {
      console.error('Error fetching report:', error)
      toast.error('Failed to load report')
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, supabase])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReport()
  }, [fetchReport])

  const [year, month] = selectedMonth.split('-')
  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="mt-1 text-gray-600">View monthly expense summaries and breakdowns</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Month</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading report...</div>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{monthName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="text-sm text-gray-600 mb-2">Total Expenses</p>
                <p className="text-5xl font-bold text-gray-900">₹{stats.totalExpenses.toLocaleString('en-IN')}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.categoryBreakdown.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No expenses in this month</p>
                ) : (
                  <div className="space-y-4">
                    {stats.categoryBreakdown.map((item) => (
                      <div key={item.name}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{item.name}</span>
                          <span className="font-bold">₹{item.amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(item.amount / stats.totalExpenses) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {((item.amount / stats.totalExpenses) * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.paymentModeBreakdown.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No expenses in this month</p>
                ) : (
                  <div className="space-y-4">
                    {stats.paymentModeBreakdown.map((item) => (
                      <div key={item.name}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{item.name}</span>
                          <span className="font-bold">₹{item.amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${(item.amount / stats.totalExpenses) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {((item.amount / stats.totalExpenses) * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
