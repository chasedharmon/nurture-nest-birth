import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/ui/fade-in'
import { TestimonialCard } from './testimonial-card'
import { siteConfig } from '@/config/site'

/**
 * Testimonials Preview Component
 *
 * Displays featured testimonials on the homepage.
 * Pulls testimonials from siteConfig for easy maintenance.
 * Just update siteConfig.testimonials to add/edit testimonials!
 */
export function TestimonialsPreview() {
  // Filter for featured testimonials only
  const featuredTestimonials = siteConfig.testimonials.filter(
    t => t.featured === true
  )

  // If no testimonials or feature is disabled, don't show section
  if (!siteConfig.features.testimonials || featuredTestimonials.length === 0) {
    return null
  }

  return (
    <section className="bg-background px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <FadeIn>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              What Families Are Saying
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Hear from families I&apos;ve had the privilege to support through
              their birth journey.
            </p>
          </div>
        </FadeIn>

        {/* Testimonials Grid */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featuredTestimonials.map((testimonial, index) => (
            <FadeIn key={testimonial.id} delay={0.1 + index * 0.1}>
              <TestimonialCard testimonial={testimonial} />
            </FadeIn>
          ))}
        </div>

        {/* CTA to All Testimonials */}
        <FadeIn delay={0.4}>
          <div className="mt-12 text-center">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 transition-all hover:border-primary hover:bg-primary/5"
            >
              <Link href="/testimonials">Read More Stories</Link>
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
