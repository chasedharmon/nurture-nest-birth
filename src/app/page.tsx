import Link from 'next/link'
import { Hero } from '@/components/marketing/hero'
import { ServicesOverview } from '@/components/marketing/services-overview'
import { TestimonialsPreview } from '@/components/marketing/testimonials-preview'
import { CtaSection } from '@/components/marketing/cta-section'
import { StatsSection, type Stat } from '@/components/stats'
import { PersonalizedBannerWrapper } from '@/components/personalization/personalized-banner-wrapper'
import { FadeIn } from '@/components/ui/fade-in'
import { Button } from '@/components/ui/button'
import { CertificationBadges } from '@/components/marketing/certification-badges'
import { spacing, maxWidth, typography } from '@/lib/design-system'
import {
  LocalBusinessStructuredData,
  OrganizationStructuredData,
} from '@/components/seo/structured-data'
import { Car, Hand, Shield } from 'lucide-react'

// Evidence-based doula impact statistics
// Sources: AJPH 2024, AJOG 2024, Cochrane Review
const stats: Stat[] = [
  {
    value: 47,
    suffix: '%',
    label: 'Lower Risk of Cesarean',
    description: 'With continuous doula support',
    icon: (
      <svg
        className="h-12 w-12"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    sourceUrl: 'https://ajph.aphapublications.org/doi/10.2105/AJPH.2024.307805',
    sourceLabel: 'AJPH 2024',
  },
  {
    value: 29,
    suffix: '%',
    label: 'Lower Risk Preterm Birth',
    description: 'Among families with doulas',
    icon: (
      <svg
        className="h-12 w-12"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    sourceUrl: 'https://ajph.aphapublications.org/doi/10.2105/AJPH.2024.307805',
    sourceLabel: 'AJPH 2024',
  },
  {
    value: 35,
    suffix: '%',
    label: 'Reduction in Severe Complications',
    description: 'Maternal morbidity reduction',
    icon: (
      <svg
        className="h-12 w-12"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
    sourceUrl:
      'https://www.ashasexualhealth.org/new-study-shows-epidurals-during-delivery-offer-more-than-just-pain-relief/',
    sourceLabel: 'Clinical Study',
  },
  {
    value: 46,
    suffix: '%',
    label: 'Higher Postpartum Visit Rate',
    description: 'Better follow-up care attendance',
    icon: (
      <svg
        className="h-12 w-12"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
    sourceUrl: 'https://www.ajog.org/article/S0002-9378(24)00869-X/fulltext',
    sourceLabel: 'AJOG 2024',
  },
]

export default function Home() {
  return (
    <>
      <LocalBusinessStructuredData />
      <OrganizationStructuredData />
      <PersonalizedBannerWrapper />
      <Hero />

      {/* Stats Section */}
      <section
        className={`bg-muted/30 ${spacing.container} ${spacing.section.lg}`}
      >
        <StatsSection
          stats={stats}
          title="The Research-Backed Impact of Doula Care"
          description="Evidence from peer-reviewed studies shows doulas significantly improve birth outcomes"
        />
      </section>

      <ServicesOverview />

      {/* Credentials & What Sets Us Apart - Combined Section */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.layout}`}>
          <FadeIn>
            <div className={`mx-auto ${maxWidth.article} text-center`}>
              <h2 className={typography.h2}>More Than Just Birth Support</h2>
              <p className="mt-4 text-muted-foreground">
                Comprehensive credentials and specialized services that most
                doulas simply cannot offer.
              </p>
            </div>
          </FadeIn>

          {/* Certification Badges */}
          <FadeIn delay={0.1}>
            <div className="mt-8 flex justify-center">
              <CertificationBadges
                variant="icons-only"
                showTooltips={true}
                filter={[
                  'birth-doula',
                  'postpartum-doula',
                  'breastfeeding',
                  'cpst',
                  'infant-massage',
                ]}
                animated={true}
              />
            </div>
          </FadeIn>

          {/* Key Differentiators - Compact */}
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <FadeIn delay={0.2}>
              <div className="flex items-start gap-3 rounded-lg border bg-background p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Car className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Car Seat Safety</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    CPST certified—73% of car seats are installed incorrectly
                  </p>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="flex items-start gap-3 rounded-lg border bg-background p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                  <Hand className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold">Infant Massage</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    CIMI certified—improve sleep, reduce colic, deepen bonding
                  </p>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="flex items-start gap-3 rounded-lg border bg-background p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">7+ Certifications</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Evidence-based expertise for every aspect of your care
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.5}>
            <div className="mt-8 text-center">
              <Button asChild variant="outline">
                <Link href="/about">Learn About My Training & Philosophy</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      <TestimonialsPreview />

      <CtaSection />
    </>
  )
}
