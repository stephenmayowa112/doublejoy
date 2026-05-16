import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: "Ayobami & Gabriel - DoubleJoy'26",
    template: "%s | Ayobami & Gabriel - DoubleJoy'26",
  },
  description: 'Join us as we celebrate the union of Ayobami Elizabeth and Gabriel Ayobamidele on June 6th, 2026',
  keywords: ['Wedding', 'Ayobami', 'Gabriel', 'DoubleJoy26', 'Nigerian Wedding'],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/images/doublejoyLogo.png', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
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
    images: [
      {
        url: '/images/doublejoyLogo.png',
        width: 1200,
        height: 630,
        alt: "DoubleJoy'26 Wedding Logo",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Ayobami & Gabriel - DoubleJoy'26",
    description: 'Join us as we celebrate the union of Ayobami Elizabeth and Gabriel Ayobamidele on June 6th, 2026',
    images: ['/images/doublejoyLogo.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  )
}
