'use client'

import { FiArrowLeft, FiHeart, FiMail, FiCamera } from 'react-icons/fi'
import Image from 'next/image'
import { useState } from 'react'
import GuestMessagesSection from '../components/GuestMessagesSection'
import MediaUploadSection from '../components/MediaUploadSection'

export default function GuestbookClient() {
  const [activeTab, setActiveTab] = useState<'messages' | 'upload'>('messages')

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-[#f3eaf7] via-[#ece0f5] to-[#f7f0e8]">
      {/* Decorative ambient background blobs — heavier purple */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-8%] left-[-8%] w-[45%] h-[45%] rounded-full bg-deep-purple/30 blur-[140px] animate-pulse"></div>
        <div className="absolute top-[20%] right-[-5%] w-[35%] h-[40%] rounded-full bg-royal-purple/25 blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-[55%] left-[10%] w-[30%] h-[35%] rounded-full bg-light-purple/40 blur-[100px] animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-[-10%] right-[15%] w-[40%] h-[35%] rounded-full bg-wedding-gold/20 blur-[130px] animate-pulse" style={{ animationDelay: '4.5s' }}></div>
        <div className="absolute top-[35%] left-[50%] w-[25%] h-[25%] rounded-full bg-deep-purple/15 blur-[90px] animate-pulse" style={{ animationDelay: '2.5s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Sticky Glass Header */}
        <header className="sticky top-0 z-50 bg-white/40 backdrop-blur-xl border-b border-white/30 shadow-[0_4px_30px_rgba(74,26,92,0.08)]">
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

            {/* Tab Switcher (Desktop) — Clay pill */}
            <div
              className="hidden sm:flex items-center rounded-full p-1.5"
              style={{
                background: 'rgba(74, 26, 92, 0.06)',
                boxShadow: 'inset 2px 2px 4px rgba(74, 26, 92, 0.08), inset -2px -2px 4px rgba(255, 255, 255, 0.7), 0 2px 8px rgba(74, 26, 92, 0.06)',
              }}
            >
              <button
                onClick={() => setActiveTab('messages')}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'messages'
                    ? 'text-white'
                    : 'text-deep-purple/60 hover:text-deep-purple'
                }`}
                style={activeTab === 'messages' ? {
                  background: 'linear-gradient(135deg, #4A1A5C 0%, #6B2D8F 100%)',
                  boxShadow: '0 4px 15px rgba(74, 26, 92, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                } : {}}
              >
                <FiMail size={15} />
                Messages
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'upload'
                    ? 'text-white'
                    : 'text-deep-purple/60 hover:text-deep-purple'
                }`}
                style={activeTab === 'upload' ? {
                  background: 'linear-gradient(135deg, #4A1A5C 0%, #6B2D8F 100%)',
                  boxShadow: '0 4px 15px rgba(74, 26, 92, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                } : {}}
              >
                <FiCamera size={15} />
                Upload Media
              </button>
            </div>

            {/* Spacer for alignment */}
            <div className="w-[76px] md:w-[100px] hidden sm:block"></div>
          </nav>
        </header>

        {/* Mobile Tab Switcher — Glass underline tabs */}
        <div className="sm:hidden sticky top-[57px] z-40 bg-white/30 backdrop-blur-xl border-b border-purple-200/30">
          <div className="flex">
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 border-b-[3px] ${
                activeTab === 'messages'
                  ? 'text-deep-purple border-deep-purple bg-deep-purple/5'
                  : 'text-gray-500 border-transparent hover:text-deep-purple'
              }`}
            >
              <FiMail size={16} />
              Messages
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 border-b-[3px] ${
                activeTab === 'upload'
                  ? 'text-deep-purple border-deep-purple bg-deep-purple/5'
                  : 'text-gray-500 border-transparent hover:text-deep-purple'
              }`}
            >
              <FiCamera size={16} />
              Upload Media
            </button>
          </div>
        </div>

        {/* Page Header — Glass card hero */}
        <div className="pt-10 md:pt-14 pb-2 md:pb-4 px-4">
          <div
            className="max-w-3xl mx-auto text-center rounded-3xl px-6 py-10 md:py-12 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(74, 26, 92, 0.07) 0%, rgba(107, 45, 143, 0.05) 50%, rgba(212, 175, 55, 0.04) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              boxShadow: '0 8px 32px rgba(74, 26, 92, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
            }}
          >
            {/* Inner glass shimmer */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-3xl"></div>
            
            {/* Floating purple orb accent */}
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-royal-purple/10 blur-xl"></div>
            <div className="absolute -bottom-4 -left-8 w-24 h-24 rounded-full bg-wedding-gold/10 blur-xl"></div>

            <div className="relative z-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-deep-purple mb-4 drop-shadow-sm">
                {activeTab === 'messages' ? 'Guestbook' : 'Share Your Moments'}
              </h1>
              <p className="text-gray-600 max-w-xl mx-auto font-sans text-sm md:text-base leading-relaxed">
                {activeTab === 'messages'
                  ? 'Leave a sweet note for us as we embark on this beautiful journey of love and double joy.'
                  : 'Help us capture every angle of our double joy! Upload your photos and videos to our shared wedding album.'
                }
              </p>
              {/* Decorative gold divider */}
              <div className="flex items-center justify-center gap-3 mt-6">
                <div className="h-px w-12 md:w-20 bg-gradient-to-r from-transparent to-wedding-gold/60"></div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.08) 100%)',
                    boxShadow: 'inset 1px 1px 3px rgba(255,255,255,0.5), inset -1px -1px 3px rgba(212, 175, 55, 0.15), 0 2px 6px rgba(212, 175, 55, 0.1)',
                  }}
                >
                  <FiHeart className="text-wedding-gold fill-wedding-gold" size={12} />
                </div>
                <div className="h-px w-12 md:w-20 bg-gradient-to-l from-transparent to-wedding-gold/60"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections — wrapped in a soft clay container */}
        <div className="px-4 md:px-8 py-8 md:py-12 pb-16 md:pb-24">
          <div
            className="max-w-7xl mx-auto rounded-3xl p-4 md:p-8"
            style={{
              background: 'rgba(255, 255, 255, 0.35)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              boxShadow: '0 8px 40px rgba(74, 26, 92, 0.06), inset 0 2px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(74, 26, 92, 0.03)',
            }}
          >
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

        {/* Footer — Deep purple glass */}
        <footer
          className="text-white py-10 px-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #3a1049 0%, #4A1A5C 40%, #5a2272 100%)',
          }}
        >
          {/* Glass shimmer overlay */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/5 to-transparent"></div>
            <div className="absolute top-[-50%] left-[20%] w-[60%] h-[100%] bg-wedding-gold/8 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-30%] right-[10%] w-[40%] h-[60%] bg-royal-purple/30 rounded-full blur-[80px]"></div>
          </div>
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-lg font-serif">With love</span>
              <FiHeart size={20} fill="currentColor" className="text-wedding-gold" />
              <span className="text-lg font-serif">DoubleJoy'26</span>
            </div>
            <p className="text-sm opacity-80">
              Ayobami Elizabeth & Gabriel Ayobamidele
            </p>
            <p className="text-xs opacity-60 mt-2">
              June 6th, 2026 | Ikeja, Lagos State
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-1.5 mt-5 text-xs font-medium px-5 py-2 rounded-full transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                color: '#D4AF37',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              <FiArrowLeft size={12} />
              Back to homepage
            </a>
          </div>
        </footer>
      </div>
    </main>
  )
}
