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

// Evidence-based doula impact statistics
// Sources: AJPH 2024, AJOG 2024, Cochrane Review
const stats: Stat[] = [
  {
    value: 47,
    suffix: '%',
    label: 'Lower Risk of Cesarean',
    description: 'With continuous doula support',
  },
  {
    value: 29,
    suffix: '%',
    label: 'Lower Risk Preterm Birth',
    description: 'Among families with doulas',
  },
  {
    value: 35,
    suffix: '%',
    label: 'Reduction in Severe Complications',
    description: 'Maternal morbidity reduction',
  },
  {
    value: 46,
    suffix: '%',
    label: 'Higher Postpartum Visit Rate',
    description: 'Better follow-up care attendance',
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
          title="The Research-Backed Impact of Doula Care"
          description="Evidence from peer-reviewed studies shows doulas significantly improve birth outcomes"
        />
      </section>

      <ServicesOverview />
      <TestimonialsPreview />
      <CtaSection />
    </>
  )
}
