import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/ui/fade-in'
import { TestimonialCard } from './testimonial-card'
import { siteConfig } from '@/config/site'
import { spacing, maxWidth, grid, typography } from '@/lib/design-system'

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
    <section
      className={`bg-background ${spacing.container} ${spacing.section.md}`}
    >
      <div className={`mx-auto ${maxWidth.layout}`}>
        {/* Section Header */}
        <FadeIn>
          <div className={`mx-auto ${maxWidth.article} text-center`}>
            <h2 className={typography.h2}>What Families Are Saying</h2>
            <p className={`mt-4 ${typography.lead}`}>
              Hear from families I&apos;ve had the privilege to support through
              their birth journey.
            </p>
          </div>
        </FadeIn>

        {/* Testimonials Grid */}
        <div className={`mt-16 grid ${grid.gap.medium} ${grid.cols.three}`}>
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
