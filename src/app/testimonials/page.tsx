import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/ui/fade-in'
import { TestimonialCard } from '@/components/marketing/testimonial-card'
import { siteConfig } from '@/config/site'
import { spacing, maxWidth, typography, grid } from '@/lib/design-system'

export const metadata: Metadata = {
  title: 'Client Testimonials | Birth Stories',
  description:
    "Read testimonials from families I've supported through birth, postpartum, and breastfeeding in Kearney, Nebraska and surrounding areas.",
  keywords: [
    'doula testimonials Kearney',
    'birth doula reviews',
    'doula client stories Nebraska',
  ],
}

/**
 * Testimonials Page
 *
 * Displays all testimonials from siteConfig.
 * Easy to maintain: just add testimonials to siteConfig.testimonials array!
 */
export default function TestimonialsPage() {
  const allTestimonials = siteConfig.testimonials

  return (
    <div className="bg-background">
      {/* Page Header */}
      <section className={`${spacing.container} ${spacing.section.lg}`}>
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn>
            <h1 className={typography.h1}>Client Stories</h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className={`mt-6 ${typography.lead}`}>
              It&apos;s an honor to support families through their birth
              journeys. Here&apos;s what some of them have shared about their
              experiences.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className={`${spacing.container} pb-20`}>
        <div className={`mx-auto ${maxWidth.layout}`}>
          <div className={`grid ${grid.gap.medium} ${grid.cols.three}`}>
            {allTestimonials.map((testimonial, index) => (
              <FadeIn key={testimonial.id} delay={index * 0.05}>
                <TestimonialCard testimonial={testimonial} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section (Optional - can add when you have real data) */}
      <section
        className={`bg-primary/5 ${spacing.container} ${spacing.section.md}`}
      >
        <div className={`mx-auto ${maxWidth.layout}`}>
          <FadeIn>
            <div
              className={`grid ${grid.gap.medium} text-center ${grid.cols.three}`}
            >
              <div>
                <div className="font-serif text-4xl font-bold text-foreground">
                  {siteConfig.business.established
                    ? `${new Date().getFullYear() - siteConfig.business.established}+`
                    : '3+'}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Years Supporting Families
                </div>
              </div>
              <div>
                <div className="font-serif text-4xl font-bold text-foreground">
                  100%
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Client Satisfaction
                </div>
              </div>
              <div>
                <div className="font-serif text-4xl font-bold text-foreground">
                  {siteConfig.location.serviceArea.length}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Communities Served
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <FadeIn>
            <h2 className={typography.h2}>Ready to Write Your Birth Story?</h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className={`mt-4 ${typography.lead}`}>
              Let&apos;s talk about how I can support your unique journey.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact">Schedule Free Consultation</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/services">View My Services</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
