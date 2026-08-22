export default function VoucherLoading() {
  return (
    <div className="min-h-[50vh] animate-pulse bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex gap-2">
          <div className="h-9 w-28 rounded-md bg-gray-200" />
          <div className="h-9 w-20 rounded-md bg-gray-200" />
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm md:p-10">
          <div className="mx-auto mb-6 h-8 w-48 rounded bg-gray-200" />
          <div className="mb-4 h-5 w-40 rounded bg-gray-200" />
          <div className="space-y-3">
            <div className="h-12 rounded bg-gray-100" />
            <div className="h-12 rounded bg-gray-100" />
            <div className="h-12 rounded bg-gray-100" />
            <div className="h-12 rounded bg-gray-100" />
            <div className="h-16 rounded bg-gray-100" />
          </div>
        </div>
        <p className="text-center text-sm text-gray-500">Loading voucher…</p>
      </div>
    </div>
  )
}
