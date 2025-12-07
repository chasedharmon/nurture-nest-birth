import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/ui/fade-in'
import { siteConfig } from '@/config/site'
import { spacing, maxWidth, typography, badge, grid } from '@/lib/design-system'

/**
 * Homepage Hero Component
 *
 * Based on 2025 doula marketing research:
 * - Clear, specific value proposition (no vague claims)
 * - Location-specific messaging
 * - Credentials prominently displayed
 * - Emotional benefits highlighted (supported, informed, empowered)
 * - Strong, clear CTAs
 */

export function Hero() {
  return (
    <section
      className={`relative overflow-hidden bg-background ${spacing.container} ${spacing.section.lg}`}
    >
      {/* Subtle organic accent shapes */}
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-secondary/5 blur-3xl" />

      <div className={`relative mx-auto ${maxWidth.layout}`}>
        <div className={`grid ${grid.gap.loose} lg:grid-cols-2`}>
          {/* Left Column - Content */}
          <div className="flex flex-col justify-center">
            {/* Credentials Badge */}
            <FadeIn>
              <div
                className={`mb-6 inline-flex items-center gap-2 self-start rounded-full ${badge.variants.primary} px-4 py-1.5`}
              >
                <svg
                  className={
                    badge.base.split(' ').includes('h-4')
                      ? 'h-4 w-4'
                      : 'h-4 w-4'
                  }
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                DONA-Certified Doula & Lactation Consultant
              </div>
            </FadeIn>

            {/* Main Headline */}
            <FadeIn delay={0.1}>
              <h1 className={typography.h1}>
                Compassionate Birth Support in{' '}
                <span className="text-primary">
                  {siteConfig.location.city}, {siteConfig.location.state}
                </span>
              </h1>
            </FadeIn>

            {/* Subheadline - Emotional Benefits */}
            <FadeIn delay={0.2}>
              <p className={`mt-6 ${typography.lead}`}>
                Personalized doula care for your pregnancy, birth, and
                postpartum journey—because you deserve to feel{' '}
                <span className="font-semibold text-foreground">supported</span>
                ,{' '}
                <span className="font-semibold text-foreground">informed</span>,
                and{' '}
                <span className="font-semibold text-foreground">empowered</span>
                .
              </p>
            </FadeIn>

            {/* Trust Indicators */}
            <FadeIn delay={0.3}>
              <div className="mt-8 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Certified Lactation Consultant
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {siteConfig.business.established &&
                    `${new Date().getFullYear() - siteConfig.business.established}+ Years`}{' '}
                  Experience
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Serving{' '}
                  {siteConfig.location.serviceArea.slice(0, 2).join(' & ')}
                </div>
              </div>
            </FadeIn>

            {/* CTAs */}
            <FadeIn delay={0.4}>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="group relative overflow-hidden text-base shadow-lg shadow-accent/20 transition-all hover:shadow-xl hover:shadow-accent/30"
                >
                  <Link href="/contact">
                    Schedule Your Free Consultation
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
                  <Link href="/services">Explore My Services</Link>
                </Button>
              </div>
            </FadeIn>
          </div>

          {/* Right Column - Image Placeholder */}
          <FadeIn delay={0.2} direction="right">
            <div className="relative hidden lg:block">
              <div className="absolute -right-6 -top-6 h-full w-full rounded-3xl bg-primary/10" />
              <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-muted shadow-2xl shadow-primary/10">
                {/* Placeholder for professional photo */}
                <Image
                  src="/images/hero-placeholder.jpg"
                  alt="Compassionate doula support"
                  fill
                  className="object-cover"
                  priority
                  sizes="50vw"
                  quality={95}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
