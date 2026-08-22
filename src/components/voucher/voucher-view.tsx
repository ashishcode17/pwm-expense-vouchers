'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Printer, Download, ArrowLeft, Edit, Trash2 } from 'lucide-react'
import type { CompanySettings } from '@/lib/types'
import { generateVoucherPDF } from '@/lib/pdf-generator'
import { createClient } from '@/lib/supabase/client'
import { ReceiptDisplay } from '@/components/voucher/receipt-display'
import toast from 'react-hot-toast'

interface VoucherData {
  id: string
  voucher_number: string
  voucher_sequence: number
  expense_date: string
  paid_to: string
  description: string
  amount: number
  amount_in_words: string
  payment_mode: string
  transaction_reference?: string
  requested_by?: string
  remarks?: string
  receipt_url?: string
  created_at: string
  category?: { name: string }
  paid_by_employee?: { name: string; designation?: string }
  approved_by_employee?: { name: string; designation?: string }
  created_by_profile?: { name: string }
}

interface VoucherViewProps {
  voucher: VoucherData
  settings: CompanySettings | null
  isAdmin?: boolean
}

export function VoucherView({ voucher, settings, isAdmin = false }: VoucherViewProps) {
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    try {
      const paidToSlug = voucher.paid_to.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30)
      const fileName = `PWM-Voucher-${voucher.voucher_sequence}-${paidToSlug}.pdf`
      await generateVoucherPDF(voucher, settings, fileName)
      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete this voucher?\nVoucher: ${voucher.voucher_number}\nPaid To: ${voucher.paid_to}\nAmount: ₹${Number(voucher.amount).toLocaleString('en-IN')}`)) {
      return
    }

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('vouchers')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', voucher.id)

      if (error) throw error

      toast.success('Voucher deleted successfully')
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Error deleting voucher:', error)
      toast.error('Failed to delete voucher')
      setDeleting(false)
    }
  }

  const brandName = settings?.brand_name || 'Property With Manish'
  const companyName = settings?.company_name || 'TYMSE INDIA PVT. LTD.'

  return (
    <div>
      <div className="print:hidden p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <div className="flex gap-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/vouchers/${voucher.id}/edit`)}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              )}
              {isAdmin && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handlePrint}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                onClick={handleDownloadPDF}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {voucher.receipt_url && (
        <div className="print:hidden px-8 pb-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <ReceiptDisplay receiptUrl={voucher.receipt_url} showDownload={true} />
          </div>
        </div>
      )}

      <div className="print:p-0 p-8 bg-gray-50">
        <div ref={printRef} className="max-w-4xl mx-auto bg-white print:shadow-none shadow-lg">
          <div className="p-12 print:p-8">
            {/* Header */}
            <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {brandName.toUpperCase()}
              </h1>
              <p className="text-lg text-gray-700 mb-4">{companyName}</p>
              {settings?.office_address && (
                <p className="text-sm text-gray-600">{settings.office_address}</p>
              )}
              {(settings?.phone || settings?.email) && (
                <p className="text-sm text-gray-600">
                  {settings.phone && `Tel: ${settings.phone}`}
                  {settings.phone && settings.email && ' | '}
                  {settings.email && `Email: ${settings.email}`}
                </p>
              )}
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 inline-block border-b-2 border-gray-900 pb-1">
                PAYMENT VOUCHER
              </h2>
            </div>

            {/* Voucher Details */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <span className="font-semibold">Voucher No:</span>{' '}
                <span className="text-lg">{voucher.voucher_number}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold">Date:</span>{' '}
                <span className="text-lg">{format(new Date(voucher.expense_date), 'dd/MM/yyyy')}</span>
              </div>
            </div>

            {/* Main Voucher Table */}
            <table className="w-full border-2 border-gray-900 mb-8">
              <tbody>
                <tr className="border-b border-gray-900">
                  <td className="p-3 font-semibold w-1/3 bg-gray-50">Paid To:</td>
                  <td className="p-3 border-l border-gray-900">{voucher.paid_to}</td>
                </tr>
                <tr className="border-b border-gray-900">
                  <td className="p-3 font-semibold bg-gray-50">Expense Category:</td>
                  <td className="p-3 border-l border-gray-900">{voucher.category?.name || 'N/A'}</td>
                </tr>
                <tr className="border-b border-gray-900">
                  <td className="p-3 font-semibold bg-gray-50">Payment Mode:</td>
                  <td className="p-3 border-l border-gray-900">
                    {voucher.payment_mode}
                    {voucher.transaction_reference && ` (Ref: ${voucher.transaction_reference})`}
                  </td>
                </tr>
                <tr className="border-b border-gray-900">
                  <td className="p-3 font-semibold bg-gray-50">Expense / Purpose:</td>
                  <td className="p-3 border-l border-gray-900 whitespace-pre-wrap">{voucher.description}</td>
                </tr>
                <tr className="border-b border-gray-900">
                  <td className="p-3 font-semibold bg-gray-50">Amount:</td>
                  <td className="p-3 border-l border-gray-900">
                    <span className="text-xl font-bold">₹{Number(voucher.amount).toLocaleString('en-IN')}</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold bg-gray-50">Amount in Words:</td>
                  <td className="p-3 border-l border-gray-900 italic">{voucher.amount_in_words}</td>
                </tr>
              </tbody>
            </table>

            {/* Additional Information */}
            {(voucher.requested_by || voucher.remarks) && (
              <div className="mb-8 space-y-2">
                {voucher.requested_by && (
                  <div>
                    <span className="font-semibold">Requested By / Expense For:</span>{' '}
                    {voucher.requested_by}
                  </div>
                )}
                {voucher.remarks && (
                  <div>
                    <span className="font-semibold">Remarks:</span>{' '}
                    {voucher.remarks}
                  </div>
                )}
              </div>
            )}

            {/* Supporting Document */}
            <div className="mb-8">
              <span className="font-semibold">Supporting Bill Attached:</span>{' '}
              <span className="font-bold">{voucher.receipt_url ? 'Yes' : 'No'}</span>
              {voucher.receipt_url && (
                <span className="print:hidden text-sm text-gray-500 ml-2">
                  (See attached bill above)
                </span>
              )}
            </div>

            {/* Signature Section */}
            <div className="grid grid-cols-4 gap-8 pt-12 mt-12 border-t border-gray-300">
              <div className="text-center">
                <div className="h-16 border-b border-gray-400 mb-2"></div>
                <p className="font-semibold text-sm">Prepared By</p>
                <p className="text-xs text-gray-600 mt-1">{voucher.created_by_profile?.name || ''}</p>
              </div>
              
              <div className="text-center">
                <div className="h-16 border-b border-gray-400 mb-2"></div>
                <p className="font-semibold text-sm">Paid By</p>
                <p className="text-xs text-gray-600 mt-1">{voucher.paid_by_employee?.name || ''}</p>
              </div>
              
              <div className="text-center">
                <div className="h-16 border-b border-gray-400 mb-2"></div>
                <p className="font-semibold text-sm">Approved By</p>
                <p className="text-xs text-gray-600 mt-1">{voucher.approved_by_employee?.name || ''}</p>
              </div>
              
              <div className="text-center">
                <div className="h-16 border-b border-gray-400 mb-2"></div>
                <p className="font-semibold text-sm">Receiver Signature</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
              <p>This is a computer-generated voucher</p>
              <p className="mt-1">Created on {format(new Date(voucher.created_at), 'dd/MM/yyyy hh:mm a')}</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  )
}
