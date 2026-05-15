import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ayobami & Gabriel - DoubleJoy'26",
    short_name: "DoubleJoy'26",
    description: 'Join us as we celebrate the union of Ayobami Elizabeth and Gabriel Ayobamidele on June 6th, 2026',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#4B0082', // Deep purple theme
    icons: [
      {
        src: '/favicon.ico', // Update if you add app icons
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}