# DoubleJoy '26 - Wedding Website

A beautiful, responsive wedding website for Ayobami Elizabeth & Gabriel Ayobamidele.

## Event Details

- **Date:** June 6th, 2026
- **Time:** 10:00 AM Prompt
- **Location:** Ikeja, Lagos State
- **Theme Colors:** Purple and Gold
- **Hashtag:** DoubleJoy'26

## RSVP Information

Please RSVP by **May 16th, 2026** for your access card.

**Contact:** Onyinye - +234 908 442 3940

## Features

- Responsive design (mobile-first approach)
- Elegant typography with Playfair Display and Inter fonts
- Deep purple and gold color scheme
- Smooth scroll navigation
- Multiple sections:
  - Hero with couple image
  - Love story
  - Video section
  - Meet the couple
  - Event details
  - RSVP information
  - Gallery preview

## Tech Stack

- **Framework:** Next.js 14
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Language:** TypeScript

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Customization

### Adding Real Images

Replace the placeholder divs with actual images:

1. Add images to the `public` folder
2. Import and use Next.js Image component:

```tsx
import Image from 'next/image'

<Image 
  src="/couple-photo.jpg" 
  alt="Ayobami and Gabriel"
  width={400}
  height={500}
  className="rounded-t-full"
/>
```

### Adding Video

Replace the video placeholder with an actual embed:

```tsx
<iframe
  className="w-full aspect-video rounded-lg"
  src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
  title="Our Love Story"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
/>
```

### Color Customization

Edit colors in `tailwind.config.js`:

```js
colors: {
  'deep-purple': '#4A1A5C',
  'royal-purple': '#6B2D8F',
  'wedding-gold': '#D4AF37',
  // Add more custom colors
}
```

## Deployment

Deploy easily on Vercel:

```bash
npm run build
```

Or push to GitHub and connect to Vercel for automatic deployments.

## Bible Verse

*"...A cord of three strands is not easily broken..."* - Ecclesiastes 4:12

---

With love ♥ DoubleJoy'26
