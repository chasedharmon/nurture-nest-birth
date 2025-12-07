import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/ui/fade-in'
import { siteConfig } from '@/config/site'

/**
 * Final CTA Section Component
 *
 * Appears at the bottom of the homepage to encourage consultation bookings.
 * Features a warm, inviting design with clear next steps.
 */
export function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-6 py-20 lg:px-8 lg:py-32">
      {/* Decorative background elements */}
      <div className="absolute -left-32 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-32 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-secondary/10 blur-3xl" />

      <div className="relative mx-auto max-w-4xl">
        <FadeIn>
          <div className="text-center">
            {/* Overline */}
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">
              Ready to Start Your Journey?
            </p>

            {/* Main Headline */}
            <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Let&apos;s Connect About Your Birth Experience
            </h2>

            {/* Supporting Text */}
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Every birth story is unique. I&apos;d love to hear about your
              hopes and answer any questions you have. Schedule a free
              consultation to see if we&apos;re a good fit.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                asChild
                size="lg"
                className="group relative overflow-hidden text-base shadow-lg shadow-accent/20 transition-all hover:shadow-xl hover:shadow-accent/30"
              >
                <Link href="/contact">
                  Schedule Free Consultation
                  <svg
                    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
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
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 text-base transition-all hover:border-primary hover:bg-primary/5"
              >
                <Link href="/faq">Common Questions</Link>
              </Button>
            </div>

            {/* Trust Signals */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Free Consultation</span>
              </div>

              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>No Pressure</span>
              </div>

              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Serving {siteConfig.location.serviceArea[0]}</span>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
