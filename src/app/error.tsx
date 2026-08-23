'use client'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
      <p className="max-w-md text-sm text-gray-600">
        Please try again. If the problem continues, contact your administrator.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
      >
        Try again
      </button>
    </div>
  )
}
