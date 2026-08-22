'use client'

import { useEffect, useMemo, useRef } from 'react'
import { ExternalLink, FileText, ImageIcon, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { validateReceiptFile } from '@/lib/upload-receipt'
import {
  formatFileSize,
  getReceiptFileName,
  isImageReceipt,
  isPdfReceipt,
} from '@/lib/receipt-utils'
import toast from 'react-hot-toast'

interface ReceiptAttachmentFieldProps {
  existingReceiptUrl?: string | null
  selectedFile: File | null
  onFileSelect: (file: File | null) => void
  removeExisting?: boolean
  onRemoveExisting?: () => void
  onUndoRemoveExisting?: () => void
  inputId?: string
}

function ReceiptPreview({
  title,
  fileName,
  previewUrl,
  isPdf,
  isImage,
  fileSize,
  openUrl,
  onRemove,
  removeLabel,
}: {
  title: string
  fileName: string
  previewUrl?: string
  isPdf: boolean
  isImage: boolean
  fileSize?: string
  openUrl?: string
  onRemove?: () => void
  removeLabel?: string
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="mt-1 text-sm text-gray-600 break-all">{fileName}</p>
          {fileSize && <p className="mt-1 text-xs text-gray-500">{fileSize}</p>}
        </div>
        {onRemove && (
          <Button type="button" variant="outline" size="sm" onClick={onRemove} className="gap-1 shrink-0">
            <Trash2 className="h-3.5 w-3.5" />
            {removeLabel || 'Remove'}
          </Button>
        )}
      </div>

      {isImage && previewUrl && (
        <a href={openUrl || previewUrl} target="_blank" rel="noopener noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={fileName}
            className="max-h-56 w-full rounded-md border border-gray-200 object-contain bg-white"
          />
        </a>
      )}

      {isPdf && (
        <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-white p-4">
          <FileText className="h-10 w-10 text-red-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">PDF Document</p>
            <p className="text-xs text-gray-500">Tap to open the uploaded receipt</p>
          </div>
          {openUrl && (
            <a
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline shrink-0"
            >
              Open
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}

      {!isImage && !isPdf && previewUrl && (
        <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-white p-4">
          <ImageIcon className="h-10 w-10 text-gray-500 shrink-0" />
          {openUrl && (
            <a
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
            >
              View file
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export function ReceiptAttachmentField({
  existingReceiptUrl,
  selectedFile,
  onFileSelect,
  removeExisting = false,
  onRemoveExisting,
  onUndoRemoveExisting,
  inputId = 'receipt',
}: ReceiptAttachmentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedPreviewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile]
  )

  useEffect(() => {
    return () => {
      if (selectedPreviewUrl) {
        URL.revokeObjectURL(selectedPreviewUrl)
      }
    }
  }, [selectedPreviewUrl])

  const showExisting =
    !!existingReceiptUrl && !removeExisting && !selectedFile

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateReceiptFile(file)
    if (validationError) {
      toast.error(validationError)
      e.target.value = ''
      return
    }

    onFileSelect(file)
    if (onUndoRemoveExisting) {
      onUndoRemoveExisting()
    }
  }

  const clearSelectedFile = () => {
    onFileSelect(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <Label htmlFor={inputId}>Attach Bill / Receipt</Label>

      {showExisting && (
        <ReceiptPreview
          title="Current uploaded file"
          fileName={getReceiptFileName(existingReceiptUrl!)}
          previewUrl={existingReceiptUrl!}
          openUrl={existingReceiptUrl!}
          isPdf={isPdfReceipt(existingReceiptUrl!)}
          isImage={isImageReceipt(existingReceiptUrl!)}
          onRemove={onRemoveExisting}
          removeLabel="Remove"
        />
      )}

      {removeExisting && !selectedFile && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Current receipt will be removed when you save.
          {onUndoRemoveExisting && (
            <button
              type="button"
              onClick={onUndoRemoveExisting}
              className="ml-2 font-medium text-amber-900 underline"
            >
              Undo
            </button>
          )}
        </div>
      )}

      {selectedFile && selectedPreviewUrl && (
        <ReceiptPreview
          title={existingReceiptUrl ? 'New file (will replace current on save)' : 'Selected file'}
          fileName={selectedFile.name}
          previewUrl={selectedPreviewUrl}
          openUrl={selectedPreviewUrl}
          isPdf={isPdfReceipt(selectedFile.name)}
          isImage={isImageReceipt(selectedFile.name) || selectedFile.type.startsWith('image/')}
          fileSize={formatFileSize(selectedFile.size)}
          onRemove={clearSelectedFile}
          removeLabel="Clear"
        />
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/jpg,application/pdf,.jpg,.jpeg,.png,.pdf"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {showExisting || selectedFile ? 'Choose another file' : 'Upload bill / receipt'}
        </Button>
        <p className="text-xs text-gray-500">JPG, PNG, or PDF. Max 5MB.</p>
      </div>
    </div>
  )
}
