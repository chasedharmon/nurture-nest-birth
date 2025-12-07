'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Testimonial Carousel Component
 *
 * Auto-rotating carousel with manual navigation.
 * Smooth transitions between testimonials.
 */

export interface Testimonial {
  quote: string
  author: string
  role?: string
  location?: string
  service?: string
  image?: string
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[]
  autoPlay?: boolean
  interval?: number
  className?: string
}

export function TestimonialCarousel({
  testimonials,
  autoPlay = true,
  interval = 6000,
  className = '',
}: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleNext = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex(prev => (prev + 1) % testimonials.length)
    setTimeout(() => setIsTransitioning(false), 500)
  }, [isTransitioning, testimonials.length])

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || testimonials.length <= 1) return

    const timer = setInterval(() => {
      handleNext()
    }, interval)

    return () => clearInterval(timer)
  }, [currentIndex, autoPlay, interval, testimonials.length, handleNext])

  const handlePrevious = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex(
      prev => (prev - 1 + testimonials.length) % testimonials.length
    )
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return
    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const currentTestimonial = testimonials[currentIndex]

  return (
    <div className={`relative ${className}`}>
      {/* Main Testimonial Card */}
      <div className="relative overflow-hidden">
        <Card className="border-2 border-primary/20 bg-card shadow-lg">
          <CardContent className="p-8 md:p-12">
            {/* Quote Icon */}
            <svg
              className="mb-6 h-12 w-12 text-primary/20"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>

            {/* Quote */}
            <blockquote
              className={`font-serif text-xl leading-relaxed text-foreground transition-opacity duration-500 md:text-2xl ${
                isTransitioning ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {currentTestimonial?.quote}
            </blockquote>

            {/* Author Info */}
            <div
              className={`mt-8 flex items-center gap-4 transition-opacity duration-500 ${
                isTransitioning ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {currentTestimonial?.image && (
                <Image
                  src={currentTestimonial.image}
                  alt={currentTestimonial.author}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
              )}
              <div>
                <div className="font-semibold text-foreground">
                  {currentTestimonial?.author}
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentTestimonial?.role && (
                    <span>{currentTestimonial.role}</span>
                  )}
                  {currentTestimonial?.location && (
                    <span>
                      {currentTestimonial.role && ' • '}
                      {currentTestimonial.location}
                    </span>
                  )}
                  {currentTestimonial?.service && (
                    <span className="mt-1 block text-xs">
                      {currentTestimonial.service}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Controls */}
      {testimonials.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            disabled={isTransitioning}
            className="rounded-full border border-border bg-background p-2 text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            aria-label="Previous testimonial"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Dot Indicators */}
          <div className="flex gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                disabled={isTransitioning}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={isTransitioning}
            className="rounded-full border border-border bg-background p-2 text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            aria-label="Next testimonial"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
