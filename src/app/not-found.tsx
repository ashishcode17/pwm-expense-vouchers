import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900">404</h1>
      <p className="text-gray-600">This page could not be found.</p>
      <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:underline">
        Back to dashboard
      </Link>
    </div>
  )
}
