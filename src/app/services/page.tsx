import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ServiceCard } from '@/components/marketing/service-card'
import {
  ServiceComparison,
  type ComparisonFeature,
  type ComparisonService,
} from '@/components/services'
import { spacing, maxWidth, grid, typography, icon } from '@/lib/design-system'

export const metadata: Metadata = {
  title: 'Services | Nurture Nest Birth | Doula Care in Central Nebraska',
  description:
    'Comprehensive doula services in Central Nebraska. Birth doula support, postpartum doula care, infant feeding support, photography, and more.',
  keywords:
    'doula services Central Nebraska, birth doula, postpartum doula, infant feeding support, birth photography Nebraska',
}

// Primary standalone services
const primaryServices = [
  {
    title: 'Birth Doula Support',
    description:
      'Continuous physical, emotional, and informational support throughout labor and birth. Includes prenatal visits, 24/7 on-call availability, and postpartum follow-up.',
    href: '/services/birth-doula',
    badge: 'Starting at $1,500',
    icon: (
      <svg
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Postpartum Doula Support',
    description:
      'In-home support during the fourth trimester. Newborn care education, feeding assistance, emotional support, and light baby-focused help so you can rest and bond.',
    href: '/services/postpartum-doula',
    badge: 'Starting at $40/hr',
    icon: (
      <svg
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    title: 'Complete Care Bundle',
    description:
      'Birth doula support plus discounted postpartum hours for seamless care from pregnancy through the fourth trimester. The best value for comprehensive support.',
    href: '/pricing',
    badge: 'Starting at $1,800',
    featured: true,
    icon: (
      <svg
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      </svg>
    ),
  },
  {
    title: 'Birth & Family Photography',
    description:
      'Professional photography capturing labor, delivery, fresh 48, and newborn sessions. Available as an add-on to doula services or standalone.',
    href: '/services/photography',
    badge: 'Contact for pricing',
    icon: (
      <svg
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
]

// Services included with doula packages
const includedServices = [
  {
    title: 'Infant Feeding Support',
    description:
      'Help with breastfeeding, bottle feeding, or combination feeding.',
    href: '/services/infant-feeding',
    includedWith: 'Postpartum Doula',
    icon: (
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
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Sibling Preparation',
    description:
      'Age-appropriate guidance for older children welcoming a new sibling.',
    href: '/services/sibling-prep',
    includedWith: 'Birth & Postpartum',
    icon: (
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
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Car Seat Safety Check',
    description: 'CPST-certified installation check and education.',
    includedWith: 'Birth & Postpartum',
    icon: (
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
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  {
    title: 'Infant Massage Instruction',
    description: 'Learn gentle massage techniques to bond with baby.',
    includedWith: 'Postpartum Doula',
    icon: (
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
          d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
        />
      </svg>
    ),
  },
]

// Service comparison data
const comparisonFeatures: ComparisonFeature[] = [
  { name: 'Prenatal Visits' },
  { name: '24/7 On-Call Support' },
  { name: 'Labor & Birth Support' },
  { name: 'Immediate Postpartum' },
  { name: 'Postpartum Follow-Up' },
  { name: 'Infant Feeding Support' },
  { name: 'Newborn Care Education' },
  { name: 'Car Seat Safety Check' },
  { name: 'Sibling Preparation' },
  { name: 'Infant Massage' },
]

const comparisonServices: ComparisonService[] = [
  {
    name: 'Birth Doula',
    description: 'Starting at $1,500',
    features: [
      '2-3 visits',
      true,
      true,
      '1-2 hours',
      '1 visit',
      'Basic',
      'Basic',
      true,
      true,
      false,
    ],
  },
  {
    name: 'Postpartum Doula',
    description: 'Starting at $40/hr',
    features: [
      false,
      'During visits',
      false,
      true,
      'Ongoing',
      'Comprehensive',
      'Comprehensive',
      true,
      true,
      true,
    ],
  },
  {
    name: 'Complete Care',
    description: 'Starting at $1,800',
    features: [
      '2-3 visits',
      true,
      true,
      true,
      'Ongoing',
      'Comprehensive',
      'Comprehensive',
      true,
      true,
      true,
    ],
    highlighted: true,
  },
]

export default function ServicesPage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section
        className={`relative overflow-hidden ${spacing.container} ${spacing.section.lg}`}
      >
        {/* Decorative background */}
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-secondary/5 blur-3xl" />

        <div className={`relative mx-auto ${maxWidth.content} text-center`}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Services
          </div>
          <h1 className={typography.h1}>
            Comprehensive Doula Care for Every Stage
          </h1>
          <p className={`mt-6 ${typography.lead}`}>
            From pregnancy through postpartum, I offer personalized support to
            help your family thrive.
          </p>
        </div>
      </section>

      {/* Primary Services Grid */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.layout}`}>
          <div className={`grid ${grid.gap.medium} ${grid.cols.four}`}>
            {primaryServices.map(service => (
              <ServiceCard key={service.href} {...service} />
            ))}
          </div>
        </div>
      </section>

      {/* Included Services */}
      <section
        className={`bg-muted/30 ${spacing.container} ${spacing.section.md}`}
      >
        <div className={`mx-auto ${maxWidth.layout}`}>
          <div className="text-center">
            <h2 className={typography.h2}>Included With Doula Packages</h2>
            <p className="mt-4 text-muted-foreground">
              These services come included with birth and postpartum doula
              packages at no additional cost.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {includedServices.map(service => (
              <Card key={service.title} className="bg-background">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {service.icon}
                    </div>
                    <div className="flex-1">
                      {service.href ? (
                        <Link
                          href={service.href}
                          className="font-semibold text-foreground hover:text-primary"
                        >
                          {service.title}
                        </Link>
                      ) : (
                        <h3 className="font-semibold text-foreground">
                          {service.title}
                        </h3>
                      )}
                      <p className="mt-1 text-sm text-muted-foreground">
                        {service.description}
                      </p>
                      <p className="mt-2 text-xs font-medium text-primary">
                        Included with: {service.includedWith}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Support */}
      <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.content}`}>
          <h2 className={`text-center ${typography.h2}`}>
            Why Invest in Doula Support?
          </h2>
          <div className={`mt-12 grid ${grid.gap.medium} ${grid.cols.two}`}>
            <div className="flex gap-4">
              <div
                className={`flex shrink-0 items-center justify-center ${icon.container.md}`}
              >
                <svg
                  className={`text-primary ${icon.size.md}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Better Birth Outcomes
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Research shows doula support leads to shorter labors, fewer
                  interventions, and increased satisfaction with the birth
                  experience.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div
                className={`flex shrink-0 items-center justify-center ${icon.container.md}`}
              >
                <svg
                  className={`text-primary ${icon.size.md}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Emotional Confidence
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Continuous support helps you feel more prepared, empowered,
                  and capable during birth and postpartum.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div
                className={`flex shrink-0 items-center justify-center ${icon.container.md}`}
              >
                <svg
                  className={`text-primary ${icon.size.md}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Partner Support
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  I help your partner feel confident and involved, providing
                  guidance so they can best support you.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div
                className={`flex shrink-0 items-center justify-center ${icon.container.md}`}
              >
                <svg
                  className={`text-primary ${icon.size.md}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Evidence-Based Care
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  I combine research-backed practices with personalized
                  attention to your unique needs and preferences.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Comparison */}
      <section className={`${spacing.container} ${spacing.section.md}`}>
        <div className={`mx-auto ${maxWidth.layout}`}>
          <ServiceComparison
            services={comparisonServices}
            features={comparisonFeatures}
            title="Compare Service Offerings"
            description="Each service is designed to support you at different stages of your journey. Mix and match to create your perfect support package."
          />
        </div>
      </section>

      {/* CTA */}
      <section
        className={`bg-primary/5 ${spacing.container} ${spacing.section.md}`}
      >
        <div className={`mx-auto ${maxWidth.content} text-center`}>
          <h2 className={typography.h2}>Ready to Get Started?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Let&apos;s schedule a free consultation to discuss your needs and
            create a personalized support plan.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/contact">Schedule Consultation</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/faq">View FAQ</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
