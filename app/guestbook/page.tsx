import type { Metadata } from 'next'
import GuestbookClient from './GuestbookClient'

export const metadata: Metadata = {
  title: "Guestbook | Ayobami & Gabriel - DoubleJoy'26",
  description: 'Leave a sweet message for the couple or share your photos and videos from the wedding celebration of Ayobami Elizabeth and Gabriel Ayobamidele.',
  openGraph: {
    title: "Guestbook | Ayobami & Gabriel - DoubleJoy'26",
    description: 'Leave a sweet message for the couple or share your photos and videos from the wedding celebration.',
    url: '/guestbook',
  },
}

export default function GuestbookPage() {
  return <GuestbookClient />
}
