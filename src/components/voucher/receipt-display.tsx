'use client'

import { ExternalLink, FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getReceiptFileName,
  isImageReceipt,
  isPdfReceipt,
} from '@/lib/receipt-utils'
import toast from 'react-hot-toast'

interface ReceiptDisplayProps {
  receiptUrl: string
  showDownload?: boolean
  compact?: boolean
}

export function ReceiptDisplay({
  receiptUrl,
  showDownload = true,
  compact = false,
}: ReceiptDisplayProps) {
  const fileName = getReceiptFileName(receiptUrl)
  const isPdf = isPdfReceipt(receiptUrl)
  const isImage = isImageReceipt(receiptUrl)

  const handleDownload = async () => {
    try {
      const response = await fetch(receiptUrl)
      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
      toast.success('Receipt downloaded')
    } catch (error) {
      console.error('Error downloading receipt:', error)
      window.open(receiptUrl, '_blank', 'noopener,noreferrer')
      toast.error('Could not download directly. Opened in new tab instead.')
    }
  }

  return (
    <div className={`rounded-lg border border-gray-200 bg-gray-50 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">Supporting Bill / Receipt</p>
          <p className="mt-1 text-sm text-gray-600 break-all">{fileName}</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <a
            href={receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open
          </a>
          {showDownload && (
            <Button variant="default" size="sm" className="gap-1" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          )}
        </div>
      </div>

      {isImage && (
        <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={receiptUrl}
            alt={fileName}
            className={`w-full rounded-md border border-gray-200 object-contain bg-white ${
              compact ? 'max-h-48' : 'max-h-96'
            }`}
          />
        </a>
      )}

      {isPdf && (
        <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-white p-4">
          <FileText className="h-10 w-10 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">PDF receipt attached</p>
            <p className="text-xs text-gray-500">Use Open or Download to view this bill</p>
          </div>
        </div>
      )}

      {!isImage && !isPdf && (
        <div className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-600">
          Receipt file attached. Use Open or Download to view it.
        </div>
      )}
    </div>
  )
}
