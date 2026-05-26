'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { FiHeart, FiMail, FiAlertTriangle, FiCheck } from 'react-icons/fi'

interface Message {
  id: string
  name: string
  message: string
  createdAt: Date
  isOptimistic?: boolean
}

interface ValidationError {
  name?: string
  email?: string
  message?: string
}

export default function GuestMessagesSection() {
  const [messages, setMessages] = useState<Message[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [formErrors, setFormErrors] = useState<ValidationError>({})
  
  // Mounted state for relative dates to prevent SSR hydration errors
  const [isMounted, setIsMounted] = useState(false)

  // Refs for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setIsMounted(true)
    fetchMessages(1, true)
  }, [])

  // Fetch paginated messages
  const fetchMessages = async (pageNum: number, replace = false) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/messages?page=${pageNum}&limit=10`)
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      const data = await response.json()
      if (data.success) {
        const fetchedMsgs = data.messages.map((m: any) => ({
          ...m,
          createdAt: new Date(m.createdAt)
        }))

        setMessages(prev => {
          if (replace) return fetchedMsgs
          // filter out duplicates (e.g. if an optimistic message was added)
          const existingIds = new Set(prev.map(p => p.id))
          const newUnique = fetchedMsgs.filter((m: any) => !existingIds.has(m.id))
          return [...prev, ...newUnique]
        })
        setHasMore(data.pagination.hasMore)
        setPage(pageNum)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle intersection for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0]
      if (target.isIntersecting && hasMore && !isLoading) {
        fetchMessages(page + 1)
      }
    },
    [page, hasMore, isLoading]
  )

  useEffect(() => {
    if (!isMounted) return

    const option = {
      root: null,
      rootMargin: '20px',
      threshold: 0,
    }

    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(handleObserver, option)
    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current)
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [handleObserver, isMounted])

  // Form Validation
  const validateForm = (): boolean => {
    const errors: ValidationError = {}
    
    const trimmedName = name.trim()
    if (!trimmedName) {
      errors.name = 'Name is required'
    } else if (trimmedName.length < 2 || trimmedName.length > 100) {
      errors.name = 'Name must be between 2 and 100 characters'
    }

    const trimmedEmail = email.trim()
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedEmail)) {
        errors.email = 'Please enter a valid email address'
      }
    }

    const trimmedMsg = message.trim()
    if (!trimmedMsg) {
      errors.message = 'Message is required'
    } else if (trimmedMsg.length < 10 || trimmedMsg.length > 1000) {
      errors.message = 'Message must be between 10 and 1000 characters'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle Form Submit (POST)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(false)

    if (!validateForm()) return

    setIsSubmitting(true)

    // Form inputs to send
    const submittedName = name.trim()
    const submittedEmail = email.trim()
    const submittedMessage = message.trim()

    // 1. Prepare optimistic message object
    const tempId = `optimistic-${Date.now()}`
    const optimisticMessage: Message = {
      id: tempId,
      name: submittedName,
      message: submittedMessage,
      createdAt: new Date(),
      isOptimistic: true
    }

    // 2. Prepend optimistic message immediately (Requirement 1.5)
    setMessages(prev => [optimisticMessage, ...prev])

    // Clear form inputs
    setName('')
    setEmail('')
    setMessage('')

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: submittedName,
          email: submittedEmail || undefined,
          message: submittedMessage
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to submit message')
      }

      if (data.success && data.message) {
        // 3. Success: replace optimistic message with real saved message
        setMessages(prev =>
          prev.map(m =>
            m.id === tempId
              ? { ...data.message, createdAt: new Date(data.message.createdAt) }
              : m
          )
        )
        setSubmitSuccess(true)
        setTimeout(() => setSubmitSuccess(false), 5000)
      }
    } catch (err: any) {
      // 4. Failure: rollback optimistic update & restore form inputs for editing
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setName(submittedName)
      setEmail(submittedEmail)
      setMessage(submittedMessage)
      setSubmitError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format Relative Timestamp
  const getRelativeTime = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 5) return 'just now'
    if (seconds < 60) return `${seconds} seconds ago`
    
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
    
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="w-full">
      <div className="grid lg:grid-cols-12 gap-8 md:gap-12 items-start">
        {/* Form Container (5 columns on large screen) */}
        <div className="lg:col-span-5 bg-white/80 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-deep-purple/10 shadow-xl relative overflow-hidden">
          {/* Glass design subtle highlight */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-wedding-gold/10 rounded-full blur-2xl"></div>
          
          <h3 className="text-2xl font-serif text-deep-purple mb-2 flex items-center gap-2">
            Leave a Message <FiHeart className="text-wedding-gold fill-wedding-gold" />
          </h3>
          <p className="text-sm text-gray-600 mb-6 font-sans">
            Write a message, share your advice, or send your warmest blessings to the couple.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 font-sans">
            {/* Guest Name */}
            <div>
              <label htmlFor="name-input" className="block text-xs font-semibold uppercase tracking-wider text-deep-purple/80 mb-1.5">
                Your Name *
              </label>
              <input
                id="name-input"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined }))
                }}
                placeholder="Ayobami"
                aria-label="Your Name"
                className={`w-full min-h-[44px] px-4 py-2 rounded-lg bg-white border ${
                  formErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-deep-purple/20 focus:border-deep-purple'
                } text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-deep-purple transition-all`}
                required
              />
              {formErrors.name && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <FiAlertTriangle className="flex-shrink-0" /> {formErrors.name}
                </p>
              )}
            </div>

            {/* Guest Email (Optional) */}
            <div>
              <label htmlFor="email-input" className="block text-xs font-semibold uppercase tracking-wider text-deep-purple/80 mb-1.5">
                Email Address (Optional)
              </label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (formErrors.email) setFormErrors(prev => ({ ...prev, email: undefined }))
                }}
                placeholder="email@example.com"
                aria-label="Email Address"
                className={`w-full min-h-[44px] px-4 py-2 rounded-lg bg-white border ${
                  formErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-deep-purple/20 focus:border-deep-purple'
                } text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-deep-purple transition-all`}
              />
              {formErrors.email && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <FiAlertTriangle className="flex-shrink-0" /> {formErrors.email}
                </p>
              )}
            </div>

            {/* Guest Message */}
            <div>
              <label htmlFor="message-input" className="block text-xs font-semibold uppercase tracking-wider text-deep-purple/80 mb-1.5">
                Your Message *
              </label>
              <textarea
                id="message-input"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value)
                  if (formErrors.message) setFormErrors(prev => ({ ...prev, message: undefined }))
                }}
                rows={5}
                placeholder="Wishing you a lifetime of double joy, endless laughter, and beautiful blessings..."
                aria-label="Your Message"
                className={`w-full px-4 py-3 rounded-lg bg-white border ${
                  formErrors.message ? 'border-red-500 focus:ring-red-500' : 'border-deep-purple/20 focus:border-deep-purple'
                } text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-deep-purple transition-all resize-none`}
                required
              ></textarea>
              <div className="flex justify-between items-center mt-1">
                {formErrors.message ? (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <FiAlertTriangle className="flex-shrink-0" /> {formErrors.message}
                  </p>
                ) : (
                  <span className="text-[10px] text-gray-400">10-1000 characters</span>
                )}
                <span className="text-[10px] text-gray-400">{message.length}/1000</span>
              </div>
            </div>

            {/* Error / Success Notifications */}
            {submitError && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 animate-fadeIn">
                <FiAlertTriangle className="flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Failed to send:</span> {submitError}
                </div>
              </div>
            )}

            {submitSuccess && (
              <div className="p-3.5 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700 flex items-center gap-2 animate-fadeIn">
                <FiCheck className="flex-shrink-0 text-lg" />
                <div>
                  <span className="font-semibold">Message sent!</span> Thank you for your warm words.
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              aria-label="Submit Message"
              className="w-full min-h-[44px] bg-deep-purple text-white rounded-lg font-medium hover:bg-royal-purple active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </button>
          </form>
        </div>

        {/* Messages List Container (7 columns on large screen) */}
        <div className="lg:col-span-7 bg-white/40 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-deep-purple/5 shadow-xl min-h-[500px] flex flex-col">
          <h3 className="text-2xl font-serif text-deep-purple mb-6 pb-2 border-b border-deep-purple/10 flex justify-between items-center">
            <span>Guestbook Messages</span>
            <span className="text-xs font-sans text-gray-500 font-normal">DoubleJoy'26 celebration</span>
          </h3>

          <div className="space-y-4 flex-grow overflow-y-auto max-h-[600px] pr-2 scrollbar-thin">
            {messages.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
                <FiMail className="text-4xl text-deep-purple/30 mb-3" />
                <p className="font-serif text-lg text-deep-purple/60">No messages yet</p>
                <p className="text-sm max-w-xs mt-1 font-sans">Be the first to leave a message and bless the sweet couple!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 md:p-5 rounded-xl border transition-all duration-300 font-sans ${
                    msg.isOptimistic
                      ? 'bg-deep-purple/5 border-deep-purple/20 opacity-60 animate-pulse'
                      : 'bg-white/80 border-deep-purple/5 shadow-sm hover:shadow-md hover:border-wedding-gold/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h4 className="font-bold text-deep-purple text-base">
                      {msg.name}
                    </h4>
                    {isMounted && (
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {msg.isOptimistic ? 'Sending...' : getRelativeTime(msg.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                    {msg.message}
                  </p>
                </div>
              ))
            )}

            {/* Load More/Infinite Scroll Trigger */}
            <div ref={loadMoreTriggerRef} className="py-4 text-center">
              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-deep-purple">
                  <svg className="animate-spin h-5 w-5 text-deep-purple" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-xs font-sans">Loading sweet messages...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
