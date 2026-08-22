export default function DashboardLoading() {
  return (
    <div className="animate-pulse p-4 md:p-8">
      <div className="mb-6 h-8 w-56 rounded bg-gray-200" />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border bg-white p-4">
            <div className="mb-3 h-3 w-20 rounded bg-gray-200" />
            <div className="h-6 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="h-64 rounded-lg border bg-white p-4">
        <div className="mb-4 h-5 w-40 rounded bg-gray-200" />
        <div className="space-y-3">
          <div className="h-16 rounded bg-gray-100" />
          <div className="h-16 rounded bg-gray-100" />
          <div className="h-16 rounded bg-gray-100" />
        </div>
      </div>
    </div>
  )
}
