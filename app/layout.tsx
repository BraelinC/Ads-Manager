import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ConvexClientProvider } from './ConvexClientProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Competitor Ad Intelligence',
  description: 'Food Saving App Niche - Meta Ads Analysis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  )
}
