import { getFileExtension } from '@/lib/upload-receipt'

export function getReceiptFileName(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const segment = pathname.split('/').pop() || 'receipt'
    return decodeURIComponent(segment)
  } catch {
    const segment = url.split('/').pop() || 'receipt'
    return decodeURIComponent(segment.split('?')[0])
  }
}

export function isPdfReceipt(source: string): boolean {
  const ext = getFileExtension(source.split('?')[0])
  return ext === 'pdf'
}

export function isImageReceipt(source: string): boolean {
  const ext = getFileExtension(source.split('?')[0])
  return ['jpg', 'jpeg', 'png'].includes(ext)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
