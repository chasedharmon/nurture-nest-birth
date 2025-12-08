import Link from 'next/link'
import { Hero } from '@/components/marketing/hero'
import { ServicesOverview } from '@/components/marketing/services-overview'
import { TestimonialsPreview } from '@/components/marketing/testimonials-preview'
import { CtaSection } from '@/components/marketing/cta-section'
import { StatsSection, type Stat } from '@/components/stats'
import { PersonalizedBannerWrapper } from '@/components/personalization/personalized-banner-wrapper'
import { FadeIn } from '@/components/ui/fade-in'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CertificationBadges } from '@/components/marketing/certification-badges'
import { spacing, maxWidth, typography } from '@/lib/design-system'
import { siteConfig } from '@/config/site'
import {
  LocalBusinessStructuredData,
  OrganizationStructuredData,
} from '@/components/seo/structured-data'
import { Car, Baby, Shield, MapPin, ArrowRight, Sparkles } from 'lucide-react'

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

      {/* What Sets Us Apart - Differentiators Section */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.layout}`}>
          <FadeIn>
            <div className={`mx-auto ${maxWidth.article} text-center`}>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                More Than Just Birth Support
              </div>
              <h2 className={typography.h2}>
                Comprehensive Care for Your Whole Family
              </h2>
              <p className="mt-4 text-muted-foreground">
                Unlike many doulas, I offer specialized services that most
                providers simply cannot—because your family deserves complete
                support.
              </p>
            </div>
          </FadeIn>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Car Seat Safety Card */}
            <FadeIn delay={0.1}>
              <Card className="group h-full overflow-hidden border-2 transition-all hover:border-blue-300 hover:shadow-lg dark:hover:border-blue-800">
                <CardContent className="relative pt-6">
                  <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-blue-100/50 transition-transform group-hover:scale-150 dark:bg-blue-900/20" />
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                      <Car className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="mt-4 font-serif text-xl font-semibold">
                      Car Seat Safety Expert
                    </h3>
                    <p className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                      CPST Certified
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      <strong className="text-foreground">
                        73% of car seats are installed incorrectly.
                      </strong>{' '}
                      I can ensure your baby travels safely from day one—a
                      service most doulas simply cannot offer.
                    </p>
                    <Link
                      href="/services/car-seat-safety"
                      className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Learn more <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Infant Massage Card */}
            <FadeIn delay={0.2}>
              <Card className="group h-full overflow-hidden border-2 transition-all hover:border-teal-300 hover:shadow-lg dark:hover:border-teal-800">
                <CardContent className="relative pt-6">
                  <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-teal-100/50 transition-transform group-hover:scale-150 dark:bg-teal-900/20" />
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/30">
                      <Baby className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h3 className="mt-4 font-serif text-xl font-semibold">
                      Infant Massage Instructor
                    </h3>
                    <p className="mt-2 text-sm font-medium text-teal-600 dark:text-teal-400">
                      CIMI Certified
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Learn techniques that{' '}
                      <strong className="text-foreground">
                        improve sleep, reduce colic, and deepen bonding
                      </strong>
                      . Included in postpartum packages or available standalone.
                    </p>
                    <Link
                      href="/services/infant-massage"
                      className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:underline dark:text-teal-400"
                    >
                      Learn more <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Evidence-Based Care Card */}
            <FadeIn delay={0.3}>
              <Card className="group h-full overflow-hidden border-2 transition-all hover:border-purple-300 hover:shadow-lg dark:hover:border-purple-800">
                <CardContent className="relative pt-6">
                  <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-purple-100/50 transition-transform group-hover:scale-150 dark:bg-purple-900/20" />
                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                      <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="mt-4 font-serif text-xl font-semibold">
                      Extensively Trained
                    </h3>
                    <p className="mt-2 text-sm font-medium text-purple-600 dark:text-purple-400">
                      7+ Certifications
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      DONA birth & postpartum doula, lactation consultant, and
                      more. I bring{' '}
                      <strong className="text-foreground">
                        evidence-based expertise
                      </strong>{' '}
                      to every aspect of your care.
                    </p>
                    <Link
                      href="/about"
                      className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-purple-600 hover:underline dark:text-purple-400"
                    >
                      See all credentials <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Credentials Banner Section */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.layout}`}>
          <FadeIn>
            <div className="text-center">
              <h2 className={typography.h2}>Certified & Trained</h2>
              <p className="mt-4 text-muted-foreground">
                Comprehensive credentials to support every aspect of your
                journey
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="mt-10 flex justify-center">
              <CertificationBadges
                variant="icons-only"
                showTooltips={true}
                filter={[
                  'dona-birth',
                  'dona-postpartum',
                  'lactation',
                  'cpst',
                  'infant-massage',
                ]}
                animated={true}
              />
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="mt-8 text-center">
              <Button asChild variant="outline">
                <Link href="/about">Learn About My Training & Philosophy</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      <TestimonialsPreview />

      {/* Service Area Section */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <FadeIn>
            <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-8 md:p-10">
              <div className="flex flex-col items-center text-center md:flex-row md:text-left">
                <div className="mb-6 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 md:mb-0 md:mr-6">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="font-serif text-2xl font-semibold">
                    Proudly Serving Central Nebraska
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    In-home doula support throughout Kearney, Grand Island,
                    Hastings, and surrounding communities
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                    {siteConfig.location.serviceArea.map((area, i) => (
                      <span
                        key={i}
                        className="rounded-full border bg-background px-3 py-1 text-sm"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-6 md:ml-6 md:mt-0">
                  <Button asChild>
                    <Link href="/contact">Get in Touch</Link>
                  </Button>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <CtaSection />
    </>
  )
}
