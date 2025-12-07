import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/ui/fade-in'
import {
  PhotoGallery,
  type GalleryImage,
} from '@/components/gallery/photo-gallery'
import { spacing, maxWidth, typography } from '@/lib/design-system'

export const metadata: Metadata = {
  title: 'Photo Gallery | Birth & Postpartum Moments',
  description:
    'Browse photos from birth support, postpartum care, and family moments. See the compassionate doula care we provide in Kearney, Nebraska.',
  keywords: [
    'doula photos Kearney',
    'birth doula gallery',
    'postpartum care photos Nebraska',
  ],
}

/**
 * Gallery Page
 *
 * Photo gallery showcasing birth support and postpartum care.
 * NOTE: Replace placeholder images with actual photos.
 * Consider using a service like Cloudinary or uploading to /public/gallery/
 */

// Placeholder images - replace with actual photos
const galleryImages: GalleryImage[] = [
  {
    src: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&h=800&fit=crop',
    alt: 'Newborn baby sleeping peacefully',
    width: 800,
    height: 800,
    caption: 'Peaceful moments in the fourth trimester',
    category: 'Newborn Care',
  },
  {
    src: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&h=800&fit=crop',
    alt: 'Mother holding newborn baby',
    width: 800,
    height: 800,
    caption: 'The first moments of bonding',
    category: 'Birth Support',
  },
  {
    src: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=800&fit=crop',
    alt: 'Pregnant mother resting',
    width: 800,
    height: 800,
    caption: 'Prenatal support and education',
    category: 'Prenatal',
  },
  {
    src: 'https://images.unsplash.com/photo-1544776193-352d25ca82cd?w=800&h=800&fit=crop',
    alt: 'Baby feet in parent hands',
    width: 800,
    height: 800,
    caption: 'Tiny miracles, big love',
    category: 'Newborn Care',
  },
  {
    src: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=800&fit=crop',
    alt: 'Mother breastfeeding baby',
    width: 800,
    height: 800,
    caption: 'Lactation support and guidance',
    category: 'Lactation',
  },
  {
    src: 'https://images.unsplash.com/photo-1519689373023-dd07c7988603?w=800&h=800&fit=crop',
    alt: 'Family with newborn',
    width: 800,
    height: 800,
    caption: 'Supporting the whole family',
    category: 'Postpartum',
  },
  {
    src: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=800&h=800&fit=crop',
    alt: 'Sibling meeting new baby',
    width: 800,
    height: 800,
    caption: 'Sibling preparation and support',
    category: 'Sibling Prep',
  },
  {
    src: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=800&fit=crop',
    alt: 'Partner supporting during labor',
    width: 800,
    height: 800,
    caption: 'Supporting partners in their support role',
    category: 'Birth Support',
  },
  {
    src: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&h=800&fit=crop',
    alt: 'Peaceful postpartum recovery',
    width: 800,
    height: 800,
    caption: 'Rest and recovery in the fourth trimester',
    category: 'Postpartum',
  },
]

export default function GalleryPage() {
  return (
    <div className="bg-background">
      {/* Page Header */}
      <section className={`${spacing.container} ${spacing.section.lg}`}>
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn>
            <h1 className={typography.h1}>Gallery</h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className={`mt-6 ${typography.lead}`}>
              Moments of connection, support, and joy from the families
              I&apos;ve had the privilege to serve.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-4 text-sm text-muted-foreground">
              Note: All photos are used with permission and some have been
              de-identified to protect privacy.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Photo Gallery */}
      <section className={`${spacing.container} pb-20`}>
        <div className={`mx-auto ${maxWidth.layout}`}>
          <PhotoGallery images={galleryImages} columns={3} />
        </div>
      </section>

      {/* CTA Section */}
      <section
        className={`bg-primary/5 ${spacing.container} ${spacing.section.md}`}
      >
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn>
            <h2 className={typography.h2}>Ready to Create Your Own Story?</h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className={`mt-4 ${typography.lead}`}>
              Let&apos;s talk about how I can support your unique birth and
              postpartum journey.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Schedule Free Consultation</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/services">View Services</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
