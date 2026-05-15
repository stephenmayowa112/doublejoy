import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: "Ayobami & Gabriel - DoubleJoy'26",
    template: "%s | Ayobami & Gabriel - DoubleJoy'26",
  },
  description: 'Join us as we celebrate the union of Ayobami Elizabeth and Gabriel Ayobamidele on June 6th, 2026',
  keywords: ['Wedding', 'Ayobami', 'Gabriel', 'DoubleJoy26', 'Nigerian Wedding'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Ayobami & Gabriel - DoubleJoy'26",
    description: 'Join us as we celebrate the union of Ayobami Elizabeth and Gabriel Ayobamidele on June 6th, 2026',
    url: '/',
    siteName: "DoubleJoy'26",
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Ayobami & Gabriel - DoubleJoy'26",
    description: 'Join us as we celebrate the union of Ayobami Elizabeth and Gabriel Ayobamidele on June 6th, 2026',
  },
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
