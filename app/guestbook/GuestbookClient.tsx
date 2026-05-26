'use client'

import { FiArrowLeft, FiHeart, FiMail, FiCamera } from 'react-icons/fi'
import Image from 'next/image'
import { useState } from 'react'
import GuestMessagesSection from '../components/GuestMessagesSection'
import MediaUploadSection from '../components/MediaUploadSection'

export default function GuestbookClient() {
  const [activeTab, setActiveTab] = useState<'messages' | 'upload'>('messages')

  return (
    <main className="relative min-h-screen bg-white">
      {/* Decorative ambient background blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-light-purple/60 blur-[120px] animate-pulse"></div>
        <div className="absolute top-[40%] right-[-10%] w-[30%] h-[50%] rounded-full bg-wedding-gold/40 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] rounded-full bg-royal-purple/40 blur-[120px] animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Sticky Header */}
        <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-white/20 shadow-sm">
          <nav className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
            {/* Back to Home */}
            <a
              href="/"
              className="flex items-center gap-2 text-deep-purple hover:text-royal-purple transition-colors group"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" size={18} />
              <Image
                src="/images/doublejoyLogo.png"
                alt="DoubleJoy'26 Logo"
                width={250}
                height={100}
                className="w-[76px] md:w-[100px] h-auto"
                priority
              />
            </a>

            {/* Tab Switcher (Desktop) */}
            <div className="hidden sm:flex items-center bg-deep-purple/5 rounded-full p-1">
              <button
                onClick={() => setActiveTab('messages')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'messages'
                    ? 'bg-deep-purple text-white shadow-md'
                    : 'text-deep-purple/70 hover:text-deep-purple'
                }`}
              >
                <FiMail size={16} />
                Messages
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'upload'
                    ? 'bg-deep-purple text-white shadow-md'
                    : 'text-deep-purple/70 hover:text-deep-purple'
                }`}
              >
                <FiCamera size={16} />
                Upload Media
              </button>
            </div>

            {/* Empty spacer for alignment */}
            <div className="w-[76px] md:w-[100px] hidden sm:block"></div>
          </nav>
        </header>

        {/* Mobile Tab Switcher */}
        <div className="sm:hidden sticky top-[57px] z-40 bg-white/80 backdrop-blur-md border-b border-deep-purple/5">
          <div className="flex">
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all border-b-2 ${
                activeTab === 'messages'
                  ? 'text-deep-purple border-deep-purple'
                  : 'text-gray-500 border-transparent hover:text-deep-purple'
              }`}
            >
              <FiMail size={16} />
              Messages
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all border-b-2 ${
                activeTab === 'upload'
                  ? 'text-deep-purple border-deep-purple'
                  : 'text-gray-500 border-transparent hover:text-deep-purple'
              }`}
            >
              <FiCamera size={16} />
              Upload Media
            </button>
          </div>
        </div>

        {/* Page Header */}
        <div className="text-center pt-12 md:pt-16 pb-6 md:pb-8 px-4">
          <h1 className="text-4xl md:text-5xl font-serif text-deep-purple mb-3">
            {activeTab === 'messages' ? 'Guestbook' : 'Share Your Moments'}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto font-sans">
            {activeTab === 'messages'
              ? 'Leave a sweet note for us as we embark on this beautiful journey of love and double joy.'
              : 'Help us capture every angle of our double joy! Upload your photos and videos to our shared wedding album.'
            }
          </p>
          {/* Decorative gold divider */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="h-px w-16 bg-wedding-gold/50"></div>
            <FiHeart className="text-wedding-gold fill-wedding-gold" size={14} />
            <div className="h-px w-16 bg-wedding-gold/50"></div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="px-4 md:px-8 pb-16 md:pb-24">
          <div className="max-w-7xl mx-auto">
            {/* Messages Tab */}
            <div className={activeTab === 'messages' ? 'block animate-fadeIn' : 'hidden'}>
              <GuestMessagesSection />
            </div>

            {/* Upload Tab */}
            <div className={activeTab === 'upload' ? 'block animate-fadeIn' : 'hidden'}>
              <MediaUploadSection />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-deep-purple text-white py-8 px-4 relative overflow-hidden">
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
            <a
              href="/"
              className="inline-block mt-4 text-xs text-wedding-gold hover:text-soft-gold transition-colors underline underline-offset-4"
            >
              ← Back to homepage
            </a>
          </div>
        </footer>
      </div>
    </main>
  )
}
