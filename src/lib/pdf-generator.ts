import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import type { CompanySettings } from './types'

interface VoucherData {
  voucher_number: string
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
  paid_by_employee?: { name: string }
  approved_by_employee?: { name: string }
  created_by_profile?: { name: string }
}

export async function generateVoucherPDF(
  voucher: VoucherData,
  settings: CompanySettings | null,
  fileName: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const brandName = settings?.brand_name || 'Property With Manish'
  const companyName = settings?.company_name || 'TYMSE INDIA PVT. LTD.'
  
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 20

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(brandName.toUpperCase(), pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 8
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(companyName, pageWidth / 2, yPos, { align: 'center' })
  
  if (settings?.office_address) {
    yPos += 6
    doc.setFontSize(10)
    doc.text(settings.office_address, pageWidth / 2, yPos, { align: 'center' })
  }
  
  if (settings?.phone || settings?.email) {
    yPos += 5
    doc.setFontSize(9)
    const contact = []
    if (settings.phone) contact.push(`Tel: ${settings.phone}`)
    if (settings.email) contact.push(`Email: ${settings.email}`)
    doc.text(contact.join(' | '), pageWidth / 2, yPos, { align: 'center' })
  }

  // Line under header
  yPos += 5
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.line(20, yPos, pageWidth - 20, yPos)

  // Title
  yPos += 12
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYMENT VOUCHER', pageWidth / 2, yPos, { align: 'center' })

  // Voucher number and date
  yPos += 10
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Voucher No: ${voucher.voucher_number}`, 20, yPos)
  doc.text(`Date: ${format(new Date(voucher.expense_date), 'dd/MM/yyyy')}`, pageWidth - 20, yPos, { align: 'right' })

  // Main table
  yPos += 5
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: [
      ['Paid To:', voucher.paid_to],
      ['Expense Category:', voucher.category?.name || 'N/A'],
      ['Payment Mode:', `${voucher.payment_mode}${voucher.transaction_reference ? ` (Ref: ${voucher.transaction_reference})` : ''}`],
      ['Expense / Purpose:', voucher.description],
      ['Amount:', `₹${Number(voucher.amount).toLocaleString('en-IN')}`],
      ['Amount in Words:', voucher.amount_in_words],
    ],
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold', fillColor: [245, 245, 245] },
      1: { cellWidth: 'auto' },
    },
  })

  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  // Additional information
  if (voucher.requested_by || voucher.remarks) {
    doc.setFontSize(10)
    if (voucher.requested_by) {
      doc.setFont('helvetica', 'bold')
      doc.text('Requested By / Expense For: ', 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(voucher.requested_by, 80, yPos)
      yPos += 6
    }
    if (voucher.remarks) {
      doc.setFont('helvetica', 'bold')
      doc.text('Remarks: ', 20, yPos)
      doc.setFont('helvetica', 'normal')
      const remarkLines = doc.splitTextToSize(voucher.remarks, pageWidth - 50)
      doc.text(remarkLines, 45, yPos)
      yPos += remarkLines.length * 5 + 3
    }
  }

  // Supporting document
  yPos += 3
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Supporting Bill Attached: ', 20, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(voucher.receipt_url ? 'Yes' : 'No', 75, yPos)

  // Signature section
  yPos += 15
  doc.setLineWidth(0.3)
  
  const sigWidth = 40
  const sigSpacing = (pageWidth - 40) / 4
  
  // Prepared By
  doc.line(20, yPos + 15, 20 + sigWidth, yPos + 15)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Prepared By', 20 + sigWidth / 2, yPos + 20, { align: 'center' })
  if (voucher.created_by_profile?.name) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(voucher.created_by_profile.name, 20 + sigWidth / 2, yPos + 25, { align: 'center' })
  }

  // Paid By
  const paidByX = 20 + sigSpacing
  doc.line(paidByX, yPos + 15, paidByX + sigWidth, yPos + 15)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Paid By', paidByX + sigWidth / 2, yPos + 20, { align: 'center' })
  if (voucher.paid_by_employee?.name) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(voucher.paid_by_employee.name, paidByX + sigWidth / 2, yPos + 25, { align: 'center' })
  }

  // Approved By
  const approvedByX = 20 + sigSpacing * 2
  doc.line(approvedByX, yPos + 15, approvedByX + sigWidth, yPos + 15)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Approved By', approvedByX + sigWidth / 2, yPos + 20, { align: 'center' })
  if (voucher.approved_by_employee?.name) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(voucher.approved_by_employee.name, approvedByX + sigWidth / 2, yPos + 25, { align: 'center' })
  }

  // Receiver Signature
  const receiverX = 20 + sigSpacing * 3
  doc.line(receiverX, yPos + 15, receiverX + sigWidth, yPos + 15)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Receiver Signature', receiverX + sigWidth / 2, yPos + 20, { align: 'center' })

  // Footer
  yPos += 35
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.2)
  doc.line(20, yPos, pageWidth - 20, yPos)
  yPos += 5
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text('This is a computer-generated voucher', pageWidth / 2, yPos, { align: 'center' })
  yPos += 4
  doc.text(`Created on ${format(new Date(voucher.created_at), 'dd/MM/yyyy hh:mm a')}`, pageWidth / 2, yPos, { align: 'center' })

  // Save the PDF
  doc.save(fileName)
}
