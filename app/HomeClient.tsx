'use client'

import { FiHeart, FiCopy, FiCheck, FiMenu, FiX } from 'react-icons/fi'
import Image from 'next/image'
import { useState } from 'react'

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [storyExpanded, setStoryExpanded] = useState(0) // 0 = collapsed, 1 = first expand, 2 = fully expanded
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [galleryVisible, setGalleryVisible] = useState(4) // Start with 4 images visible
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    element?.scrollIntoView({ behavior: 'smooth' })
    setIsMobileMenuOpen(false) // Close menu on click
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const loadMoreGallery = () => {
    setGalleryVisible(prev => Math.min(prev + 8, galleryImages.length))
  }

  // Gallery images
  const galleryImages = [
    { src: '/images/DSC_8374 2.jpg.jpeg', alt: "Ayobami and Gabriel sharing a joyful moment" },
    { src: '/images/DSC_8382.jpg.jpeg', alt: "Ayobami and Gabriel looking into each other's eyes" },
    { src: '/images/DSC_8392.jpg.jpeg', alt: "Gabriel posing for a pre-wedding portrait" },
    { src: '/images/DSC_8403.jpg.jpeg', alt: "Ayobami glowing in her beautiful outfit" },
    { src: '/images/DSC_8405.jpg.jpeg', alt: "Ayobami and Gabriel elegant portrait" },
    { src: '/images/DSC_8408.jpg.jpeg', alt: "Couple sharing a laugh during their shoot" },
    { src: '/images/WhatsApp Image 2026-05-14 at 13.47.47.jpeg', alt: "Ayobami and Gabriel sweet couple moment" },
    { src: '/images/WhatsApp Image 2026-05-14 at 13.47.47a.jpeg', alt: "Ayobami and Gabriel having fun together" },
    { src: '/images/WhatsApp Image 2026-05-14 at 13.47.47b.jpeg', alt: "Candid moment of the beautiful couple" },
    { src: '/images/WhatsApp Image 2026-05-14 at 13.47.47c.jpeg', alt: "Ayobami and Gabriel romantic portrait" },
    { src: '/images/WhatsApp Image 2026-05-14 at 13.47.48d.jpeg', alt: "Couple's beautiful traditional pre-wedding photo" },
    { src: '/images/WhatsApp Image 2026-05-14 at 13.47.48e.jpeg', alt: "Ayobami smiling brightly next to Gabriel" },
    { src: '/images/WhatsApp Image 2026-05-14 at 13.47.48f.jpeg', alt: "Gabriel looking at his bride-to-be" },
    { src: '/images/WhatsApp Image 2026-05-14 at 13.47.48g.jpeg', alt: "Ayobami and Gabriel holding hands" },
    { src: '/images/WhatsApp Image 2026-05-14 at 13.47.49.jpeg', alt: "Beautiful couple embracing" },
    { src: '/images/WhatsApp Image 2026-05-14 at 13.47.49h.jpeg', alt: "Ayobami and Gabriel lovely outdoor shoot" },
    { src: '/images/WhatsApp Image 2026-05-14 at 13.47.49k.jpeg', alt: "Ayobami posing elegantly" },
    { src: '/images/WhatsApp Image 2026-05-14 at 13.47.49l.jpeg', alt: "Gabriel looking dapper in his outfit" },
    { src: '/images/WhatsApp Image 2026-05-14 at 13.47.50aa.jpeg', alt: "Couple sharing a tender moment" },
    { src: '/images/WhatsApp Image 2026-05-14 at 13.47.50asd.jpeg', alt: "Ayobami and Gabriel stunning pose" },
    { src: '/images/WhatsApp Image 2026-05-14 at 13.47.51bn.jpeg', alt: "Playful couple photo of Ayobami and Gabriel" },
    { src: '/images/WhatsApp Image 2026-05-14 at 13.53.21bas.jpeg', alt: "Ayobami and Gabriel happy and in love" },
    { src: '/images/WhatsApp Image 2026-05-14 at 14.02.18mnb.jpeg', alt: "Beautiful close-up of Ayobami and Gabriel" },
    { src: '/images/WhatsApp Image 2026-05-14 at 14.42.49nhgs.jpeg', alt: "Ayobami and Gabriel classic pre-wedding photo" },
  ]

  return (
    <main className="relative min-h-screen bg-white">
      {/* Decorative ambient background blobs for glassmorphism */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-light-purple/60 blur-[120px] animate-pulse"></div>
        <div className="absolute top-[40%] right-[-10%] w-[30%] h-[50%] rounded-full bg-wedding-gold/40 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] rounded-full bg-royal-purple/40 blur-[120px] animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10">
        <div className="sticky top-0 z-50 flex flex-col">
          {/* Announcement Bar */}
          <div className="bg-deep-purple text-white py-2 px-4 text-center text-xs md:text-sm">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
              <span className="font-light">
                Your love for love brought you here... DoubleJoy'26 | ⚠️ Strictly By Invitation Only
              </span>
              <button 
                onClick={() => scrollToSection('rsvp')}
                className="bg-wedding-gold text-deep-purple px-4 py-1 rounded-full text-xs font-medium hover:bg-soft-gold transition-colors"
              >
                RSVP Now
              </button>
            </div>
          </div>

          {/* Header Navigation */}
          <header className="bg-white/70 backdrop-blur-md border-b border-white/20 shadow-sm transition-all duration-300">
            <nav className="max-w-7xl mx-auto px-4 md:px-8 py-2 md:py-3 flex items-center justify-between">
            <button 
              onClick={() => scrollToSection('home')} 
            className="flex items-center hover:opacity-80 transition-opacity w-32 md:w-48 h-8 md:h-10 relative"
            aria-label="Go to home"
          >
            <Image
              src="/images/doublejoyLogo.png"
              alt="DoubleJoy'26 Logo"
              width={250}
              height={100}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[76px] md:w-[118px] h-auto max-w-none"
              priority
            />
          </button>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('home')} className="text-gray-700 hover:text-deep-purple transition-colors">
              Home
            </button>
            <button onClick={() => scrollToSection('event-details')} className="text-gray-700 hover:text-deep-purple transition-colors">
              Event Details
            </button>
            <button onClick={() => scrollToSection('rsvp')} className="text-gray-700 hover:text-deep-purple transition-colors">
              RSVP
            </button>
            <button onClick={() => scrollToSection('gifting')} className="text-gray-700 hover:text-deep-purple transition-colors">
              Gifting
            </button>
            <button onClick={() => scrollToSection('gallery')} className="text-gray-700 hover:text-deep-purple transition-colors">
              Gallery
            </button>
          </div>
          <div className="md:hidden flex items-center gap-4">
            <button 
              aria-label="Toggle menu" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700"
            >
              {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg py-4 px-6 flex flex-col gap-4 animate-fadeIn">
            <button onClick={() => scrollToSection('home')} className="text-left text-gray-800 text-lg hover:text-deep-purple transition-colors">
              Home
            </button>
            <button onClick={() => scrollToSection('event-details')} className="text-left text-gray-800 text-lg hover:text-deep-purple transition-colors">
              Event Details
            </button>
            <button onClick={() => scrollToSection('rsvp')} className="text-left text-gray-800 text-lg hover:text-deep-purple transition-colors">
              RSVP
            </button>
            <button onClick={() => scrollToSection('gifting')} className="text-left text-gray-800 text-lg hover:text-deep-purple transition-colors">
              Gifting
            </button>
            <button onClick={() => scrollToSection('gallery')} className="text-left text-gray-800 text-lg hover:text-deep-purple transition-colors">
              Gallery
            </button>
          </div>
        )}
      </header>
      </div>

      {/* Hero Section */}
      <section id="home" className="relative bg-gradient-to-b from-white/80 to-white/40 backdrop-blur-sm section-padding overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-sm md:text-base text-gray-600 mb-2">
              June 6th, 2026 | 10 AM Prompt
            </p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-deep-purple mb-2">
              Ayobami & Gabriel
            </h1>
            <p className="text-lg md:text-xl text-royal-purple italic">
              DoubleJoy'26
            </p>
          </div>

          {/* Couple Image with Floral Decorations */}
          <div className="relative max-w-4xl mx-auto my-12">
            {/* Left Floral */}
            <div className="absolute left-0 bottom-0 w-32 md:w-48 h-32 md:h-48 opacity-60">
              <svg viewBox="0 0 200 200" className="w-full h-full text-light-purple">
                <circle cx="50" cy="150" r="30" fill="currentColor" opacity="0.3" />
                <circle cx="80" cy="130" r="25" fill="currentColor" opacity="0.4" />
                <circle cx="40" cy="120" r="20" fill="currentColor" opacity="0.5" />
                <path d="M 50 150 Q 60 100 80 80" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M 50 150 Q 30 110 20 90" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </div>

            {/* Right Floral */}
            <div className="absolute right-0 bottom-0 w-32 md:w-48 h-32 md:h-48 opacity-60">
              <svg viewBox="0 0 200 200" className="w-full h-full text-light-purple">
                <circle cx="150" cy="150" r="30" fill="currentColor" opacity="0.3" />
                <circle cx="120" cy="130" r="25" fill="currentColor" opacity="0.4" />
                <circle cx="160" cy="120" r="20" fill="currentColor" opacity="0.5" />
                <path d="M 150 150 Q 140 100 120 80" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M 150 150 Q 170 110 180 90" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </div>

            {/* Couple Image Placeholder */}
            <div className="relative z-10 mx-auto w-64 md:w-96 h-96 md:h-[500px] rounded-t-full overflow-hidden shadow-2xl">
              <Image
                src="/images/WhatsApp Image 2026-05-14 at 13.47.47.jpeg"
                alt="Ayobami & Gabriel"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-12">
            <button 
              onClick={() => scrollToSection('event-details')}
              className="btn-primary w-full md:w-auto"
            >
              EVENT DETAILS
            </button>
            <button 
              onClick={() => scrollToSection('rsvp')}
              className="btn-primary w-full md:w-auto bg-wedding-gold hover:bg-soft-gold text-deep-purple"
            >
              RSVP
            </button>
            <button 
              onClick={() => scrollToSection('gallery')}
              className="btn-secondary w-full md:w-auto"
            >
              GALLERY
            </button>
          </div>

          {/* Bible Verse */}
          <div className="text-center mt-12 max-w-2xl mx-auto">
            <p className="text-sm text-gray-500 mb-2">Ecclesiastes 4:12</p>
            <p className="text-lg md:text-xl font-serif text-deep-purple italic">
              "...A cord of three strands is not easily broken..."
            </p>
          </div>
        </div>
      </section>

      {/* The Story Section */}
      <section id="story" className="bg-white/40 backdrop-blur-md section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Image */}
            <div className="order-2 md:order-1">
              <div className="relative w-full h-96 md:h-[500px] rounded-lg overflow-hidden shadow-xl">
                <Image
                  src="/images/DSC_8382.jpg.jpeg"
                  alt="Our Story"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Content */}
            <div className="order-1 md:order-2">
              <h2 className="text-4xl md:text-5xl font-serif text-deep-purple mb-6">
                .......in the beginning
              </h2>
              
              {/* Initial content - always visible */}
              <p className="text-gray-700 leading-relaxed mb-4">
                Quite the weird love story, honestly.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                We actually met at the gym. And yes! this is your sign to stop ignoring that 
                membership card and "start next Monday." 🌚
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Funny thing is, the year before, I had promised myself I'd finally take fitness 
                seriously after my birthday. I had a gym close to my house, but it was under 
                renovation, and if I'm being honest, I also wanted somewhere a little less 
                familiar. Somewhere I could sweat in peace without seeing half the neighbourhood. 
                So I switched locations.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Little did I know I was not only going there to lose weight… apparently, I went 
                there to lose my singlehood too.
              </p>

              {/* First expansion - visible after first click */}
              {storyExpanded >= 1 && (
                <div className="animate-fadeIn">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    I had been consistent for a couple of months when we met. And the irony? On the 
                    exact day we met, I was exhausted, irritated, and fully ready to go home. I walked 
                    up to my coach to announce my resignation from fitness for the day, and standing 
                    there was this seemingly calm, gentleman-looking human being. (Heavy emphasis on 
                    *seemingly*, because now? Hmm. That's another conversation.)
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    My coach introduced us because we were namesakes, and that was supposed to be the 
                    end of it. I went back to my corner because Coach refused to let me escape without 
                    finishing my routine.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Then this man walks up to me and says, <span className="italic">"If you beg me, 
                    I'll tell Coach to let you go home."</span>
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    The audacity. The confidence. The nonsense.
                  </p>
                </div>
              )}

              {/* Second expansion - visible after second click */}
              {storyExpanded >= 2 && (
                <div className="animate-fadeIn">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    But somehow, we started talking. And talking. And talking. So much that I still 
                    didn't finish that routine. Instead, we ended up walking home together.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    And somehow, since that day, we've just kept talking, walking, gyming, laughing, 
                    arguing, gist-ing, and doing life together.
                  </p>
                  <p className="text-royal-purple font-medium italic">
                    Turns out the gym really does change people's lives. Just not in the way I expected. 
                    DoubleJoy'26
                  </p>
                </div>
              )}

              {/* Read More Button */}
              {storyExpanded < 2 && (
                <button
                  onClick={() => setStoryExpanded(storyExpanded + 1)}
                  className="mt-4 text-deep-purple font-medium hover:text-royal-purple transition-colors flex items-center gap-2 group"
                >
                  <span>Read More</span>
                  <svg 
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section id="video" className="section-padding bg-white/40 backdrop-blur-md">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-deep-purple mb-4">
            Our Love Story
          </h2>
          <p className="text-gray-600 mb-8">
            Watch how our journey unfolded
          </p>
          
          {/* Video Placeholder */}
          <div className="relative w-full aspect-video bg-gradient-to-br from-deep-purple to-royal-purple rounded-lg overflow-hidden shadow-2xl">
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1"></div>
                </div>
                <p className="text-lg font-serif">Pre-Wedding Video</p>
                <p className="text-sm mt-2 opacity-80">Embed your Vimeo/YouTube video here</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Couple Section */}
      <section id="couple" className="section-padding bg-white/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif text-deep-purple text-center mb-12">
            Meet the Couple
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Gabriel */}
            <div className="text-center">
              <div className="relative w-full h-96 md:h-[500px] rounded-lg overflow-hidden mb-6">
                <Image
                  src="/images/ayo1.jpeg"
                  alt="Gabriel Ayobamidele"
                  fill
                  className="object-contain"
                />
              </div>
              <h3 className="text-3xl md:text-4xl font-serif text-deep-purple mb-4">
                GABRIEL
              </h3>
              <p className="text-gray-700 leading-relaxed max-w-md mx-auto">
                Gabriel Ayobamidele is a man of faith, vision, and purpose. With a heart 
                devoted to serving God and loving others, he brings joy, wisdom, and 
                steadfast commitment to everything he does. His love for Ayobami is a 
                testament to his character—patient, kind, and unwavering.
              </p>
            </div>

            {/* Ayobami */}
            <div className="text-center">
              <div className="relative w-full h-96 md:h-[500px] rounded-lg overflow-hidden mb-6">
                <Image
                  src="/images/ayo2.jpeg"
                  alt="Ayobami Elizabeth"
                  fill
                  className="object-contain"
                />
              </div>
              <h3 className="text-3xl md:text-4xl font-serif text-deep-purple mb-4">
                AYOBAMI
              </h3>
              <p className="text-gray-700 leading-relaxed max-w-md mx-auto">
                Ayobami Elizabeth is a woman of grace, strength, and compassion. Her 
                radiant spirit and genuine love for people make her a blessing to all who 
                know her. She brings warmth, laughter, and unwavering faith into Gabriel's 
                life, making their bond truly special.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Event Details Section */}
      <section id="event-details" className="relative section-padding overflow-hidden">
        {/* Decorative blur for Event Details background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute left-[10%] top-[20%] w-[30%] h-[60%] bg-deep-purple/40 rounded-full blur-[100px]"></div>
        </div>
        <div className="relative max-w-4xl mx-auto text-center z-10">
          <h2 className="text-3xl md:text-4xl font-serif text-deep-purple mb-8">
            Event Details
          </h2>
          
          <div className="bg-gradient-to-br from-deep-purple/90 to-royal-purple/80 backdrop-blur-xl border border-white/20 text-white rounded-2xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.15)] relative overflow-hidden">
            {/* Inner glass reflection */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

            <div className="mb-8 relative z-10">
              <p className="text-sm uppercase tracking-wider mb-2 text-soft-gold">
                The Families of
              </p>
              <p className="text-lg mb-2">
                Elder & Evangelist Ajibola Afolabi Ajayi
              </p>
              <p className="text-sm opacity-90 mb-4">
                Of Ita-Ogbolu, Akure-North, Ondo State
              </p>
              <p className="text-2xl font-serif text-wedding-gold my-4">&</p>
              <p className="text-lg mb-2">
                Late Chief & Mrs Samuel Bamidele Akande
              </p>
              <p className="text-sm opacity-90">
                Of Araromi-Ora, Ifelodun LGA, Kwara State
              </p>
            </div>

            <div className="border-t border-white/30 pt-8 mt-8">
              <p className="text-sm uppercase tracking-wider mb-4 text-soft-gold">
                Invite you to celebrate
              </p>
              <h3 className="text-3xl md:text-4xl font-serif mb-6">
                Ayobami Elizabeth & Gabriel Ayobamidele
              </h3>
              
              <div className="space-y-4 text-lg">
                <p>
                  <span className="text-wedding-gold font-medium">Date:</span> June 6th, 2026
                </p>
                <p>
                  <span className="text-wedding-gold font-medium">Time:</span> 10:00 AM Prompt
                </p>
                <p>
                  <span className="text-wedding-gold font-medium">Location:</span> Ikeja, Lagos State
                </p>
                <p>
                  <span className="text-wedding-gold font-medium">Theme Colors:</span> Purple and Gold
                </p>
              </div>
              
              {/* Invitation Notice */}
              <div className="mt-8 bg-wedding-gold/20 border-2 border-wedding-gold rounded-lg p-4">
                <p className="text-wedding-gold font-bold text-sm md:text-base">
                  ⚠️ STRICTLY BY INVITATION ONLY
                </p>
                <p className="text-white/90 text-sm mt-1">
                  No Plus Ones • Access Card Required
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RSVP Section */}
      <section id="rsvp" className="relative section-padding overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[30%] right-[10%] w-[35%] h-[50%] bg-wedding-gold/40 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[10%] left-[5%] w-[40%] h-[40%] bg-light-purple/40 rounded-full blur-[90px]"></div>
        </div>

        <div className="relative max-w-2xl mx-auto text-center z-10">
          <h2 className="text-3xl md:text-4xl font-serif text-deep-purple mb-4">
            RSVP
          </h2>
          <p className="text-gray-700 mb-4">
            Please confirm your attendance by May 16th, 2026 to receive your access card
          </p>
          
          {/* Invitation Notice */}
          <div className="bg-deep-purple/10 border-2 border-deep-purple rounded-lg p-4 mb-8">
            <p className="text-deep-purple font-semibold text-sm md:text-base">
              ⚠️ STRICTLY BY INVITATION ONLY • NO PLUS ONES
            </p>
            <p className="text-gray-700 text-sm mt-2">
              This is an intimate celebration. Only invited guests will be admitted.
            </p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-8 md:p-12">
            <div className="mb-8">
              <p className="text-lg text-gray-700 mb-2">
                Contact for RSVP:
              </p>
              <p className="text-2xl font-serif text-deep-purple mb-1">
                Onyinye
              </p>
              <a 
                href="tel:+2349084423940" 
                className="text-xl text-royal-purple hover:text-wedding-gold transition-colors"
              >
                +234 908 442 3940
              </a>
            </div>
            
            <div className="border-t border-gray-200 pt-8">
              <p className="text-sm text-gray-600 mb-4">
                RSVP Deadline: May 16th, 2026
              </p>
              <a 
                href="tel:+2349084423940"
                className="btn-primary inline-block"
              >
                Call to RSVP
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Preview Section */}
      <section id="gallery" className="section-padding bg-white/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif text-deep-purple text-center mb-12">
            Gallery
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryImages.slice(0, galleryVisible).map((image, index) => (
              <div 
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300 cursor-pointer animate-fadeIn"
                onClick={() => setSelectedImage(image.src)}
                role="button"
                tabIndex={0}
                aria-label={`View enlarged ${image.alt}`}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedImage(image.src)}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          
          {galleryVisible < galleryImages.length && (
            <div className="text-center mt-8">
              <button 
                onClick={loadMoreGallery}
                className="btn-secondary"
              >
                View More ({galleryImages.length - galleryVisible} remaining)
              </button>
            </div>
          )}

          {galleryVisible >= galleryImages.length && (
            <div className="text-center mt-8">
              <p className="text-gray-600 italic">
                You've reached the end of our gallery 💜
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-4 transition-all duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <button
            aria-label="Close image gallery modal"
            className="absolute top-4 right-4 text-white text-4xl hover:text-wedding-gold transition-colors focus:outline-none focus:ring-2 focus:ring-wedding-gold rounded"
            onClick={() => setSelectedImage(null)}
          >
            ×
          </button>
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full">
            <Image
              src={selectedImage}
              alt="Enlarged gallery image"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}

      {/* Gifting Section */}
      <section id="gifting" className="relative section-padding overflow-hidden">
        {/* Decorative blur for Gifting background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute right-[5%] bottom-[20%] w-[30%] h-[50%] bg-wedding-gold/40 rounded-full blur-[100px]"></div>
          <div className="absolute left-[5%] top-[10%] w-[40%] h-[40%] bg-royal-purple/40 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative max-w-5xl mx-auto z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-serif text-deep-purple mb-4">
              Wedding Gift
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-6">
              Your presence at our wedding is the greatest gift. However, if you wish to honor us with a gift, 
              we would be grateful for a contribution towards our future together.
            </p>
            
            {/* Gift Policy Notice */}
            <div className="max-w-2xl mx-auto bg-deep-purple/10 border-2 border-deep-purple rounded-lg p-4 mb-8">
              <p className="text-deep-purple font-bold text-base md:text-lg mb-2">
                💰 MONETARY GIFTS ONLY
              </p>
              <p className="text-gray-700 text-sm md:text-base">
                We kindly request that all gifts be monetary contributions.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Naira Transfers */}
            <div className="bg-deep-purple/80 backdrop-blur-xl border border-white/20 text-white rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.15)] relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-0"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-wedding-gold rounded-full flex items-center justify-center text-deep-purple font-bold text-xl">
                    ₦
                  </div>
                  <h3 className="text-xl font-serif">Naira Transfers</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/5">
                    <p className="text-sm text-soft-gold mb-1">Account Number</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-mono">2032909827</p>
                      <button
                        onClick={() => copyToClipboard('2032909827', 'naira-account')}
                        className="p-2 hover:bg-white/20 rounded transition-colors"
                        title="Copy Naira account number"
                      aria-label="Copy Naira account number to clipboard"
                    >
                      {copiedField === 'naira-account' ? (
                        <FiCheck size={18} className="text-wedding-gold" aria-hidden="true" />
                      ) : (
                        <FiCopy size={18} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-sm text-soft-gold mb-1">Account Name</p>
                  <p className="text-lg">Ayobami Ajayi</p>
                </div>
                
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-sm text-soft-gold mb-1">Bank</p>
                  <p className="text-lg">First Bank of Nigeria</p>
                </div>
              </div>
              </div>
            </div>

            {/* Canadian Dollar Transfers */}
            <div className="bg-gradient-to-br from-royal-purple to-light-purple text-white rounded-lg p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-wedding-gold rounded-full flex items-center justify-center text-deep-purple font-bold text-xl">
                  C$
                </div>
                <h3 className="text-xl font-serif">Canadian Dollar</h3>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-sm text-soft-gold mb-1">Interac Transfer</p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg break-all">aeajayi@gmail.com</p>
                    <button
                      onClick={() => copyToClipboard('aeajayi@gmail.com', 'cad-email')}
                      className="p-2 hover:bg-white/20 rounded transition-colors ml-2"
                      title="Copy Interac email"
                      aria-label="Copy Canadian Dollar Interac email to clipboard"
                    >
                      {copiedField === 'cad-email' ? (
                        <FiCheck size={18} className="text-wedding-gold" aria-hidden="true" />
                      ) : (
                        <FiCopy size={18} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-sm text-soft-gold mb-1">Bank Options</p>
                  <p className="text-lg">Scotiabank or RBC</p>
                </div>
              </div>
            </div>

            {/* US Dollar Transfers */}
            <div className="bg-gradient-to-br from-light-purple to-royal-purple text-white rounded-lg p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-wedding-gold rounded-full flex items-center justify-center text-deep-purple font-bold text-xl">
                  $
                </div>
                <h3 className="text-xl font-serif">US Dollar</h3>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white/10 rounded-lg p-4">
                  <p className="text-sm text-soft-gold mb-1">Account Number</p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-mono">2045393701</p>
                    <button
                      onClick={() => copyToClipboard('2045393701', 'usd-account')}
                      className="p-2 hover:bg-white/20 rounded transition-colors"
                      title="Copy US Dollar account number"
                      aria-label="Copy US Dollar account number to clipboard"
                    >
                      {copiedField === 'usd-account' ? (
                        <FiCheck size={18} className="text-wedding-gold" aria-hidden="true" />
                      ) : (
                        <FiCopy size={18} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/5">
                  <p className="text-sm text-soft-gold mb-1">Account Name</p>
                  <p className="text-lg">Gabriel A. Akande</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/5">
                  <p className="text-sm text-soft-gold mb-1">Bank</p>
                  <p className="text-lg">First Bank</p>
                </div>
              </div>
            </div>

            {/* Bitcoin Wallet */}
            <div className="bg-gradient-to-br from-deep-purple/80 via-royal-purple/80 to-light-purple/80 backdrop-blur-xl border border-white/20 text-white rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.15)] relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-0"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-wedding-gold rounded-full flex items-center justify-center text-deep-purple font-bold text-lg">
                    ₿
                  </div>
                  <h3 className="text-xl font-serif">Bitcoin (BTC)</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/5">
                    <p className="text-sm text-soft-gold mb-2">Wallet Address</p>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-mono break-all leading-relaxed">
                        1FfLqngqxBeMf5SRn4gyTHNcQZJ29AVuNm
                      </p>
                      <button
                        onClick={() => copyToClipboard('1FfLqngqxBeMf5SRn4gyTHNcQZJ29AVuNm', 'btc-wallet')}
                        className="p-2 hover:bg-white/20 rounded transition-colors flex-shrink-0"
                        title="Copy Bitcoin wallet address"
                        aria-label="Copy Bitcoin wallet address to clipboard"
                      >
                        {copiedField === 'btc-wallet' ? (
                          <FiCheck size={18} className="text-wedding-gold" aria-hidden="true" />
                        ) : (
                          <FiCopy size={18} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/5">
                    <p className="text-sm text-soft-gold mb-1">Network</p>
                    <p className="text-lg">Bitcoin (BTC)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600 italic mb-2">
              Thank you for your love and generosity 💜
            </p>
            <p className="text-sm text-gray-500">
              Please note: Only monetary gifts will be accepted
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-deep-purple text-white py-8 px-4 relative overflow-hidden">
        {/* Decorative blur for footer */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[-50%] left-[20%] w-[60%] h-[100%] bg-wedding-gold/10 rounded-full blur-[100px]"></div>
        </div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-lg">With love</span>
            <FiHeart size={20} fill="currentColor" className="text-wedding-gold" />
            <span className="text-lg">DoubleJoy'26</span>
          </div>
          <p className="text-sm opacity-80">
            Ayobami Elizabeth & Gabriel Ayobamidele
          </p>
          <p className="text-xs opacity-60 mt-2">
            June 6th, 2026 | Ikeja, Lagos State
          </p>
        </div>
      </footer>
      </div>
    </main>
  )
}
