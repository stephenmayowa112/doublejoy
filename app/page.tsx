import type { Metadata } from 'next'
import HomeClient from './HomeClient'

export const metadata: Metadata = {
  title: 'Home | Ayobami & Gabriel - DoubleJoy\'26',
  description: 'Welcome to the wedding celebration of Ayobami Elizabeth and Gabriel Ayobamidele. Join us in Ikeja, Lagos State on June 6th, 2026.',
  openGraph: {
    title: 'Home | Ayobami & Gabriel - DoubleJoy\'26',
    description: 'Welcome to the wedding celebration of Ayobami Elizabeth and Gabriel Ayobamidele. Join us in Ikeja, Lagos State on June 6th, 2026.',
    url: '/',
    images: [
      {
        url: '/images/DSC_8382.jpg.jpeg',
        width: 1200,
        height: 630,
        alt: 'Ayobami & Gabriel',
      },
    ],
  },
}

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: 'Wedding Celebration of Ayobami Elizabeth and Gabriel Ayobamidele',
    startDate: '2026-06-06T10:00:00+01:00', // Lagos Time
    endDate: '2026-06-06T18:00:00+01:00',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: 'Ikeja',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Ikeja',
        addressRegion: 'Lagos State',
        addressCountry: 'NG'
      }
    },
    image: [
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/images/DSC_8382.jpg.jpeg`
    ],
    description: 'Join us as we celebrate the union of Ayobami Elizabeth and Gabriel Ayobamidele on June 6th, 2026.',
    performer: [
      {
        '@type': 'Person',
        name: 'Ayobami Elizabeth'
      },
      {
        '@type': 'Person',
        name: 'Gabriel Ayobamidele'
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  )
}
