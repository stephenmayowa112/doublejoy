'use client'

import { Search, Heart } from 'lucide-react'
import Image from 'next/image'

export default function Home() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Announcement Bar */}
      <div className="bg-deep-purple text-white py-3 px-4 text-center text-sm md:text-base">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <span className="font-light">
            Your love for love brought you here... DoubleJoy'26
          </span>
          <button 
            onClick={() => scrollToSection('rsvp')}
            className="bg-wedding-gold text-deep-purple px-6 py-1.5 rounded-full text-sm font-medium hover:bg-soft-gold transition-colors"
          >
            RSVP Now
          </button>
        </div>
      </div>

      {/* Header Navigation */}
      <header className="sticky top-0 bg-white shadow-sm z-50">
        <nav className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="text-3xl md:text-4xl font-serif text-deep-purple font-bold">
            AG
          </div>
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
            <button onClick={() => scrollToSection('gallery')} className="text-gray-700 hover:text-deep-purple transition-colors">
              Gallery
            </button>
            <button className="text-gray-700 hover:text-deep-purple transition-colors">
              <Search size={20} />
            </button>
          </div>
          <div className="md:hidden">
            <Search size={20} className="text-gray-700" />
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative bg-gradient-to-b from-white to-gray-50 section-padding overflow-hidden">
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
            <div className="relative z-10 mx-auto w-64 md:w-96 h-96 md:h-[500px] bg-gradient-to-br from-deep-purple to-royal-purple rounded-t-full overflow-hidden shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center text-white text-center p-8">
                <div>
                  <Heart size={48} className="mx-auto mb-4" />
                  <p className="text-lg font-serif">Couple Photo</p>
                  <p className="text-sm mt-2 opacity-80">Cutout style image</p>
                </div>
              </div>
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
      <section id="story" className="bg-gray-100 section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Image */}
            <div className="order-2 md:order-1">
              <div className="w-full h-96 md:h-[500px] bg-gradient-to-br from-royal-purple to-deep-purple rounded-lg overflow-hidden shadow-xl">
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <Heart size={48} className="mx-auto mb-4" />
                    <p className="text-lg font-serif">Our Story Photo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="order-1 md:order-2">
              <h2 className="text-4xl md:text-5xl font-serif text-deep-purple mb-6">
                .......in the beginning
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                In the summer of "DoubleJoy", at a moment orchestrated by divine grace, 
                Gabriel and Ayobami's paths crossed for the first time. What started as a 
                casual introduction quickly blossomed into something far more meaningful—a 
                connection rooted in faith, laughter, and shared dreams.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Their journey has been one of growth, patience, and unwavering support for 
                one another. Through every season, they've discovered that love is not just 
                a feeling, but a choice—a daily commitment to honor, cherish, and uplift 
                each other.
              </p>
              <p className="text-royal-purple font-medium italic">
                It was crafted in the heavens and revealed on earth. DoubleJoy'26
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section id="video" className="section-padding bg-white">
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
      <section id="couple" className="section-padding bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif text-deep-purple text-center mb-12">
            Meet the Couple
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Gabriel */}
            <div className="text-center">
              <div className="w-full h-96 md:h-[500px] bg-gray-300 rounded-lg overflow-hidden shadow-xl mb-6 grayscale">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-600 text-white">
                  <div>
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center text-4xl font-serif">
                      G
                    </div>
                    <p className="text-lg font-serif">Portrait Photo</p>
                  </div>
                </div>
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
              <div className="w-full h-96 md:h-[500px] bg-gray-300 rounded-lg overflow-hidden shadow-xl mb-6 grayscale">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-600 text-white">
                  <div>
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center text-4xl font-serif">
                      A
                    </div>
                    <p className="text-lg font-serif">Portrait Photo</p>
                  </div>
                </div>
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
      <section id="event-details" className="section-padding bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-deep-purple mb-8">
            Event Details
          </h2>
          
          <div className="bg-gradient-to-br from-deep-purple to-royal-purple text-white rounded-lg p-8 md:p-12 shadow-2xl">
            <div className="mb-8">
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
            </div>
          </div>
        </div>
      </section>

      {/* RSVP Section */}
      <section id="rsvp" className="section-padding bg-gradient-to-br from-soft-gold to-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-deep-purple mb-4">
            RSVP
          </h2>
          <p className="text-gray-700 mb-8">
            Please confirm your attendance by May 16th, 2026 to receive your access card
          </p>
          
          <div className="bg-white rounded-lg shadow-xl p-8 md:p-12">
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
      <section id="gallery" className="section-padding bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif text-deep-purple text-center mb-12">
            Gallery
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div 
                key={item}
                className="aspect-square bg-gradient-to-br from-light-purple to-royal-purple rounded-lg overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300 cursor-pointer"
              >
                <div className="w-full h-full flex items-center justify-center text-white">
                  <Heart size={32} className="opacity-50" />
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <button className="btn-secondary">
              View Full Gallery
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-deep-purple text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-lg">With love</span>
            <Heart size={20} fill="currentColor" className="text-wedding-gold" />
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
    </main>
  )
}
