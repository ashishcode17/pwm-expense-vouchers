'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { amountToWords } from '@/lib/amount-to-words'
import toast from 'react-hot-toast'
import type { Employee, ExpenseCategory } from '@/lib/types'
import { uploadReceiptFile } from '@/lib/upload-receipt'
import { ReceiptAttachmentField } from '@/components/voucher/receipt-attachment-field'

export default function NewVoucherPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  
  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    paid_to: '',
    category_id: '',
    description: '',
    amount: '',
    payment_mode: 'Cash',
    transaction_reference: '',
    paid_by: '',
    requested_by: '',
    approved_by: '',
    remarks: '',
  })
  
  const [receiptFile, setReceiptFile] = useState<File | null>(null)

  const amountWords = useMemo(() => {
    if (formData.amount) {
      const amount = parseFloat(formData.amount)
      if (!isNaN(amount)) {
        return amountToWords(amount)
      }
    }
    return ''
  }, [formData.amount])

  const fetchData = async () => {
    try {
      const [categoriesRes, employeesRes] = await Promise.all([
        supabase.from('expense_categories').select('*').eq('active', true).order('name'),
        supabase.from('employees').select('*').eq('active', true).order('name'),
      ])

      if (categoriesRes.data) setCategories(categoriesRes.data)
      if (employeesRes.data) setEmployees(employeesRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load form data')
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
    fetchData()
  }, [])

  const generateVoucherNumber = async () => {
    const year = new Date().getFullYear()
    
    const { data, error } = await supabase.rpc('get_next_voucher_number', {
      voucher_year: year
    })

    if (error) throw error

    const sequence = data as number
    const voucherNumber = `PWM/EXP/${year}/${String(sequence).padStart(4, '0')}`
    
    return { voucherNumber, sequence }
  }

  const handleFileChange = (file: File | null) => {
    setReceiptFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.paid_to || !formData.category_id || !formData.description || !formData.amount) {
      toast.error('Please fill in all required fields')
      return
    }

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload receipt first so staff never need UPDATE (admin-only after hardening)
      let receiptPath: string | null = null
      if (receiptFile) {
        setUploading(true)
        try {
          receiptPath = await uploadReceiptFile(supabase, user.id, receiptFile)
        } finally {
          setUploading(false)
        }
      }

      const { voucherNumber, sequence } = await generateVoucherNumber()

      const voucherData = {
        voucher_number: voucherNumber,
        voucher_sequence: sequence,
        expense_date: formData.expense_date,
        paid_to: formData.paid_to,
        category_id: formData.category_id,
        description: formData.description,
        amount: amount,
        amount_in_words: amountWords,
        payment_mode: formData.payment_mode,
        transaction_reference: formData.transaction_reference || null,
        paid_by: formData.paid_by || null,
        requested_by: formData.requested_by || null,
        approved_by: formData.approved_by || null,
        remarks: formData.remarks || null,
        receipt_url: receiptPath,
        created_by: user.id,
      }

      const { data: voucher, error } = await supabase
        .from('vouchers')
        .insert(voucherData)
        .select()
        .single()

      if (error) throw error

      toast.success(`Voucher ${voucherNumber} created successfully!`)
      router.push(`/dashboard/vouchers/${voucher.id}`)
    } catch (error) {
      console.error('Error creating voucher:', error)
      const message = error instanceof Error ? error.message : 'Failed to create voucher'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">New Expense Voucher</h1>
        <p className="mt-1 text-sm text-gray-600 md:text-base">Create a new expense voucher</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Voucher Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Voucher Number</Label>
                <Input value="Auto-generated" disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500">Format: PWM/EXP/YYYY/NNNN</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense_date">Date *</Label>
                <Input
                  id="expense_date"
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paid_to">Paid To *</Label>
              <Input
                id="paid_to"
                placeholder="e.g., Rahul, ABC Stationers, Uber"
                value={formData.paid_to}
                onChange={(e) => setFormData({ ...formData, paid_to: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1250"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Amount in Words</Label>
                <div className="p-2 bg-gray-50 border rounded-md text-sm min-h-[40px] flex items-center">
                  {amountWords || 'Enter amount to see words'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id">Expense Category *</Label>
              <select
                id="category_id"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Expense Description / Purpose *</Label>
              <Textarea
                id="description"
                placeholder="e.g., Printing of 100 Kainchi Retreat brochures for client meeting"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_mode">Payment Mode *</Label>
                <select
                  id="payment_mode"
                  value={formData.payment_mode}
                  onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {formData.payment_mode !== 'Cash' && (
                <div className="space-y-2">
                  <Label htmlFor="transaction_reference">Transaction / Reference ID</Label>
                  <Input
                    id="transaction_reference"
                    placeholder="e.g., UPI Ref: 123456789"
                    value={formData.transaction_reference}
                    onChange={(e) => setFormData({ ...formData, transaction_reference: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paid_by">Paid By</Label>
                <select
                  id="paid_by"
                  value={formData.paid_by}
                  onChange={(e) => setFormData({ ...formData, paid_by: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requested_by">Requested By / Expense For</Label>
                <Input
                  id="requested_by"
                  placeholder="Name or department"
                  value={formData.requested_by}
                  onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="approved_by">Approved By</Label>
                <select
                  id="approved_by"
                  value={formData.approved_by}
                  onChange={(e) => setFormData({ ...formData, approved_by: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select approver</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <ReceiptAttachmentField
              selectedFile={receiptFile}
              onFileSelect={handleFileChange}
              inputId="new-receipt"
            />

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Additional notes or comments"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={loading || uploading}
            className="w-full flex-1 sm:w-auto"
          >
            {loading ? 'Creating Voucher...' : 'Create Voucher'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push('/dashboard')}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
