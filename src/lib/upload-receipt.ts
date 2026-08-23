import type { SupabaseClient } from '@supabase/supabase-js'

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf'] as const
const MAX_FILE_SIZE = 5 * 1024 * 1024

const MIME_TYPES: Record<(typeof ALLOWED_EXTENSIONS)[number], string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
}

export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || ''
}

export function isAllowedReceiptFile(file: File): boolean {
  const ext = getFileExtension(file.name)
  if (ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
    return true
  }

  if (file.type && Object.values(MIME_TYPES).includes(file.type)) {
    return true
  }

  return false
}

export function validateReceiptFile(file: File): string | null {
  if (!isAllowedReceiptFile(file)) {
    return 'Please upload JPG, PNG, or PDF files only'
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'File size should be less than 5MB'
  }

  return null
}

export function getUploadErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'Failed to upload receipt'

  if (message.includes('Bucket not found')) {
    return 'Storage bucket missing. Run the storage setup SQL in Supabase.'
  }

  if (message.includes('row-level security') || message.includes('RLS')) {
    return 'Upload blocked by permissions. Run the security hardening SQL in Supabase.'
  }

  if (message.includes('mime type') || message.includes('Invalid file type')) {
    return 'File type not allowed. Use JPG, PNG, or PDF.'
  }

  if (message.includes('Payload too large') || message.includes('maximum allowed size')) {
    return 'File is too large. Maximum size is 5MB.'
  }

  return message
}

/** Extract storage object path from a full URL or bare path. */
export function getReceiptStoragePath(receiptUrl: string): string | null {
  if (!receiptUrl) return null
  if (!receiptUrl.includes('://')) {
    return receiptUrl.replace(/^\/+/, '')
  }
  try {
    const pathname = new URL(receiptUrl).pathname
    const markers = ['/object/public/vouchers/', '/object/sign/vouchers/', '/object/authenticated/vouchers/']
    for (const marker of markers) {
      const idx = pathname.indexOf(marker)
      if (idx >= 0) {
        return decodeURIComponent(pathname.slice(idx + marker.length))
      }
    }
    const parts = pathname.split('/vouchers/')
    if (parts.length > 1) return decodeURIComponent(parts[1])
  } catch {
    return null
  }
  return null
}

export async function resolveReceiptUrl(
  supabase: SupabaseClient,
  receiptUrl: string,
  expiresIn = 3600
): Promise<string> {
  const path = getReceiptStoragePath(receiptUrl)
  if (!path) return receiptUrl

  const { data, error } = await supabase.storage.from('vouchers').createSignedUrl(path, expiresIn)
  if (error || !data?.signedUrl) {
    return receiptUrl
  }
  return data.signedUrl
}

/**
 * Upload under receipts/{userId}/... so RLS can scope by owner.
 * Returns the storage path (not a public URL) for private buckets.
 */
export async function uploadReceiptFile(
  supabase: SupabaseClient,
  ownerUserId: string,
  file: File
): Promise<string> {
  const validationError = validateReceiptFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const ext = getFileExtension(file.name) || 'jpg'
  const safeExt = ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])
    ? ext
    : 'jpg'
  const filePath = `receipts/${ownerUserId}/${Date.now()}.${safeExt}`
  const contentType =
    file.type ||
    MIME_TYPES[safeExt as (typeof ALLOWED_EXTENSIONS)[number]] ||
    'application/octet-stream'

  const { error: uploadError } = await supabase.storage.from('vouchers').upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType,
  })

  if (uploadError) {
    throw new Error(getUploadErrorMessage(uploadError))
  }

  return filePath
}
