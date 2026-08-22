import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { CapacitorBackButton } from '@/components/capacitor-back-button'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PWM Expense Vouchers',
  description: 'Property With Manish - Expense Management System',
  applicationName: 'PWM Expense Vouchers',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PWM Vouchers',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#0f4c81',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CapacitorBackButton />
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
