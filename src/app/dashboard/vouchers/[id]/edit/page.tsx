'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { amountToWords } from '@/lib/amount-to-words'
import toast from 'react-hot-toast'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'
import { uploadReceiptFile } from '@/lib/upload-receipt'
import { ReceiptAttachmentField } from '@/components/voucher/receipt-attachment-field'

interface Employee {
  id: string
  name: string
  active?: boolean
}

interface Category {
  id: string
  name: string
  active?: boolean
}

interface Voucher {
  id: string
  voucher_number: string
  expense_date: string
  paid_to: string
  amount: number
  category_id: string
  description: string
  payment_mode: string
  transaction_ref: string | null
  paid_by: string
  requested_by: string | null
  approved_by: string | null
  remarks: string | null
  receipt_url: string | null
}

export default function EditVoucherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [removeExistingReceipt, setRemoveExistingReceipt] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState<Partial<Voucher>>({})
  const router = useRouter()
  const supabase = createClient()

  const amountWords = useMemo(() => {
    if (formData.amount) {
      return amountToWords(Number(formData.amount))
    }
    return ''
  }, [formData.amount])

  const fetchData = useCallback(async () => {
    try {
      // Check user permissions
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      // Fetch voucher
      const { data: voucher, error: voucherError } = await supabase
        .from('vouchers')
        .select('*')
        .eq('id', id)
        .single()

      if (voucherError) throw voucherError

      // Only admin can edit vouchers
      if (profile?.role !== 'admin') {
        toast.error('Only admins can edit vouchers')
        router.push(`/dashboard/vouchers/${id}`)
        return
      }

      setFormData(voucher)

      // Fetch employees and categories (filter active ones client-side)
      const [employeesRes, categoriesRes] = await Promise.all([
        supabase.from('employees').select('id, name, active').order('name'),
        supabase.from('expense_categories').select('id, name, active').order('name')
      ])

      // Filter active ones client-side
      setEmployees((employeesRes.data || []).filter(e => e.active))
      setCategories((categoriesRes.data || []).filter(c => c.active))
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load voucher')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }, [id, router, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('vouchers')
        .update({
          expense_date: formData.expense_date,
          paid_to: formData.paid_to,
          amount: formData.amount,
          category_id: formData.category_id,
          description: formData.description,
          payment_mode: formData.payment_mode,
          paid_by: formData.paid_by,
          requested_by: formData.requested_by,
          approved_by: formData.approved_by,
          remarks: formData.remarks,
        })
        .eq('id', id)

      if (error) throw error

      if (removeExistingReceipt && !receiptFile) {
        const { error: removeError } = await supabase
          .from('vouchers')
          .update({ receipt_url: null })
          .eq('id', id)

        if (removeError) throw removeError
      }

      if (receiptFile) {
        setUploading(true)
        try {
          const receiptUrl = await uploadReceiptFile(supabase, id, receiptFile)
          const { error: receiptError } = await supabase
            .from('vouchers')
            .update({ receipt_url: receiptUrl })
            .eq('id', id)

          if (receiptError) throw receiptError
        } catch (uploadError) {
          console.error('Error uploading receipt:', uploadError)
          const message =
            uploadError instanceof Error ? uploadError.message : 'Failed to upload receipt'
          toast.error(message)
          return
        } finally {
          setUploading(false)
        }
      }

      toast.success('Voucher updated successfully!')
      router.push(`/dashboard/vouchers/${id}`)
    } catch (error) {
      console.error('Error updating voucher:', error)
      toast.error('Failed to update voucher')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !formData.id) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-500">Loading voucher...</p>
      </div>
    )
  }

  if (employees.length === 0 || categories.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href={`/dashboard/vouchers/${id}`}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Voucher
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Cannot Load Edit Form</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-red-600 font-semibold mb-4">
                ⚠️ Missing Required Data
              </p>
              <p className="text-gray-600 mb-4">
                {employees.length === 0 && 'Employees data not accessible.'}
                {categories.length === 0 && ' Categories data not accessible.'}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This might be due to missing RLS policies in Supabase.
                <br />
                Please run the SQL script first!
              </p>
              <Link href={`/dashboard/vouchers/${id}`}>
                <Button>Back to Voucher</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/dashboard/vouchers/${id}`}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Voucher
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Expense Voucher</CardTitle>
          <p className="text-sm text-gray-600">Voucher Number: {formData.voucher_number}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expense_date">Date</Label>
                <Input
                  id="expense_date"
                  type="date"
                  value={formData.expense_date || ''}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paid_to">Paid To</Label>
                <Input
                  id="paid_to"
                  type="text"
                  value={formData.paid_to || ''}
                  onChange={(e) => setFormData({ ...formData, paid_to: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  required
                />
                {amountWords && (
                  <p className="text-xs text-gray-600 italic">{amountWords}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category_id">Expense Category</Label>
                <Select 
                  value={formData.category_id || ''} 
                  onValueChange={(value) => value && setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {formData.category_id 
                        ? categories.find(c => c.id === formData.category_id)?.name || 'Select category'
                        : 'Select category'
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
              />
            </div>

            <Card className="border-blue-100 bg-blue-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Bill / Receipt Attachment</CardTitle>
                <p className="text-sm text-gray-600">
                  View the current receipt, upload a new one, or remove the existing file.
                </p>
              </CardHeader>
              <CardContent>
                <ReceiptAttachmentField
                  existingReceiptUrl={formData.receipt_url}
                  selectedFile={receiptFile}
                  onFileSelect={setReceiptFile}
                  removeExisting={removeExistingReceipt}
                  onRemoveExisting={() => {
                    setRemoveExistingReceipt(true)
                    setReceiptFile(null)
                  }}
                  onUndoRemoveExisting={() => setRemoveExistingReceipt(false)}
                  inputId="edit-receipt"
                />
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="payment_mode">Payment Mode</Label>
                <Select 
                  value={formData.payment_mode || ''} 
                  onValueChange={(value) => value && setFormData({ ...formData, payment_mode: value })}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {formData.payment_mode || 'Select payment mode'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.payment_mode && formData.payment_mode !== 'Cash' && (
                <div className="space-y-2">
                  <Label htmlFor="transaction_ref">Transaction/Reference ID</Label>
                  <Input
                    id="transaction_ref"
                    type="text"
                    value={formData.transaction_ref || ''}
                    onChange={(e) => setFormData({ ...formData, transaction_ref: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="paid_by">Paid By</Label>
                <Select 
                  value={formData.paid_by || ''} 
                  onValueChange={(value) => value && setFormData({ ...formData, paid_by: value })}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {formData.paid_by 
                        ? employees.find(e => e.id === formData.paid_by)?.name || 'Select employee'
                        : 'Select employee'
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requested_by">Requested By (Optional)</Label>
                <Input
                  id="requested_by"
                  type="text"
                  value={formData.requested_by || ''}
                  onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="approved_by">Approved By</Label>
                <Select 
                  value={formData.approved_by || ''} 
                  onValueChange={(value) => value && setFormData({ ...formData, approved_by: value })}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {formData.approved_by 
                        ? employees.find(e => e.id === formData.approved_by)?.name || 'Select employee'
                        : 'Select employee'
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks (Optional)</Label>
              <Textarea
                id="remarks"
                value={formData.remarks || ''}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={saving || uploading} className="gap-2">
                <Save className="h-4 w-4" />
                {saving || uploading ? 'Updating...' : 'Update Voucher'}
              </Button>
              <Link href={`/dashboard/vouchers/${id}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
