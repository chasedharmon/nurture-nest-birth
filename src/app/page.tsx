import { Hero } from '@/components/marketing/hero'
import { ServicesOverview } from '@/components/marketing/services-overview'
import { TestimonialsPreview } from '@/components/marketing/testimonials-preview'
import { CtaSection } from '@/components/marketing/cta-section'
import { StatsSection, type Stat } from '@/components/stats'
import { spacing } from '@/lib/design-system'
import {
  LocalBusinessStructuredData,
  OrganizationStructuredData,
} from '@/components/seo/structured-data'

// Stats data - can be replaced with real-time API data
const stats: Stat[] = [
  {
    value: 100,
    suffix: '%',
    label: 'Client Satisfaction',
    description: 'Families recommend our services',
  },
  {
    value: 50,
    suffix: '+',
    label: 'Births Supported',
    description: 'Families welcomed their babies',
  },
  {
    value: 15,
    suffix: '+',
    label: 'Years Experience',
    description: 'Supporting families in birth',
  },
  {
    value: 24,
    suffix: '/7',
    label: 'On-Call Support',
    description: 'Available when you need us',
  },
]

export default function Home() {
  return (
    <>
      <LocalBusinessStructuredData />
      <OrganizationStructuredData />
      <Hero />

      {/* Stats Section */}
      <section
        className={`bg-muted/30 ${spacing.container} ${spacing.section.lg}`}
      >
        <StatsSection
          stats={stats}
          title="Trusted by Families in Central Nebraska"
          description="Real results from real families we've had the privilege to support"
        />
      </section>

      <ServicesOverview />
      <TestimonialsPreview />
      <CtaSection />
    </>
  )
}
