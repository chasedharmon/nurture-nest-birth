import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/ui/fade-in'
import { TestimonialCard } from '@/components/marketing/testimonial-card'
import { siteConfig } from '@/config/site'

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
      <section className="px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Client Stories
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-6 text-xl text-muted-foreground">
              It&apos;s an honor to support families through their birth
              journeys. Here&apos;s what some of them have shared about their
              experiences.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="px-6 pb-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {allTestimonials.map((testimonial, index) => (
              <FadeIn key={testimonial.id} delay={index * 0.05}>
                <TestimonialCard testimonial={testimonial} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section (Optional - can add when you have real data) */}
      <section className="bg-primary/5 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <div className="grid gap-8 text-center sm:grid-cols-3">
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
      <section className="px-6 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <h2 className="font-serif text-3xl font-bold text-foreground">
              Ready to Write Your Birth Story?
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="mt-4 text-lg text-muted-foreground">
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
