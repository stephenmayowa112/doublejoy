import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ayobami & Gabriel - DoubleJoy\'26',
  description: 'Join us as we celebrate the union of Ayobami Elizabeth and Gabriel Ayobamidele on June 6th, 2026',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
