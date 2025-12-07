'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { trackEvent, EVENTS } from '@/lib/analytics'

/**
 * Photo Gallery Component
 *
 * Optimized image gallery with lightbox view and lazy loading.
 * Uses Next.js Image for automatic optimization.
 */

export interface GalleryImage {
  src: string
  alt: string
  width: number
  height: number
  caption?: string
  category?: string
}

interface PhotoGalleryProps {
  images: GalleryImage[]
  columns?: 2 | 3 | 4
  className?: string
}

export function PhotoGallery({
  images,
  columns = 3,
  className = '',
}: PhotoGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  const handleImageClick = (image: GalleryImage) => {
    setSelectedImage(image)
    trackEvent(EVENTS.GALLERY_IMAGE_VIEW, {
      image_alt: image.alt,
      category: image.category,
    })
  }

  const handleClose = () => {
    setSelectedImage(null)
  }

  const handleNext = () => {
    if (!selectedImage) return
    const currentIndex = images.findIndex(img => img.src === selectedImage.src)
    const nextIndex = (currentIndex + 1) % images.length
    const nextImage = images[nextIndex]
    if (nextImage) {
      setSelectedImage(nextImage)
    }
  }

  const handlePrevious = () => {
    if (!selectedImage) return
    const currentIndex = images.findIndex(img => img.src === selectedImage.src)
    const previousIndex = (currentIndex - 1 + images.length) % images.length
    const previousImage = images[previousIndex]
    if (previousImage) {
      setSelectedImage(previousImage)
    }
  }

  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  return (
    <>
      {/* Gallery Grid */}
      <div className={`grid gap-4 ${gridCols[columns]} ${className}`}>
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => handleImageClick(image)}
            className="group relative aspect-square overflow-hidden rounded-lg bg-muted transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            {image.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="text-sm font-medium text-white">
                  {image.caption}
                </p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <Lightbox
          image={selectedImage}
          onClose={handleClose}
          onNext={handleNext}
          onPrevious={handlePrevious}
          hasNext={images.length > 1}
          hasPrevious={images.length > 1}
        />
      )}
    </>
  )
}

interface LightboxProps {
  image: GalleryImage
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
  hasNext: boolean
  hasPrevious: boolean
}

function Lightbox({
  image,
  onClose,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}: LightboxProps) {
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && hasNext) onNext()
      if (e.key === 'ArrowLeft' && hasPrevious) onPrevious()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onNext, onPrevious, hasNext, hasPrevious])

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Close lightbox"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Previous Button */}
      {hasPrevious && (
        <button
          onClick={e => {
            e.stopPropagation()
            onPrevious()
          }}
          className="absolute left-4 z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Previous image"
        >
          <svg
            className="h-6 w-6"
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
      )}

      {/* Image */}
      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={e => e.stopPropagation()}
      >
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          className="h-auto max-h-[90vh] w-auto max-w-[90vw] rounded-lg object-contain"
          priority
        />
        {image.caption && (
          <div className="mt-4 rounded-lg bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-center text-sm text-white">{image.caption}</p>
          </div>
        )}
      </div>

      {/* Next Button */}
      {hasNext && (
        <button
          onClick={e => {
            e.stopPropagation()
            onNext()
          }}
          className="absolute right-4 z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Next image"
        >
          <svg
            className="h-6 w-6"
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
      )}

      {/* Keyboard hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-xs text-white/70 backdrop-blur-sm">
        Use arrow keys to navigate • ESC to close
      </div>
    </div>
  )
}
