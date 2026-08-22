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
    return 'Upload blocked by permissions. Run the storage setup SQL in Supabase.'
  }

  if (message.includes('mime type') || message.includes('Invalid file type')) {
    return 'File type not allowed. Use JPG, PNG, or PDF.'
  }

  if (message.includes('Payload too large') || message.includes('maximum allowed size')) {
    return 'File is too large. Maximum size is 5MB.'
  }

  return message
}

export async function uploadReceiptFile(
  supabase: SupabaseClient,
  voucherId: string,
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
  const filePath = `receipts/${voucherId}-${Date.now()}.${safeExt}`
  const contentType =
    file.type ||
    MIME_TYPES[safeExt as (typeof ALLOWED_EXTENSIONS)[number]] ||
    'application/octet-stream'

  const { error: uploadError } = await supabase.storage
    .from('vouchers')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType,
    })

  if (uploadError) {
    throw new Error(getUploadErrorMessage(uploadError))
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('vouchers').getPublicUrl(filePath)

  return publicUrl
}
