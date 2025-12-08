import { ServiceCard } from './service-card'
import { FadeIn } from '@/components/ui/fade-in'
import { siteConfig } from '@/config/site'
import { spacing, maxWidth, grid, typography } from '@/lib/design-system'

/**
 * Services Overview Component
 *
 * Displays service cards on the homepage.
 * Services are pulled from siteConfig for easy maintenance,
 * with icons mapped separately for visual appeal.
 */

// Icon mapping for each service (not in config since they're JSX)
const serviceIcons: Record<string, React.ReactNode> = {
  'birth-doula': (
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
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  ),
  'postpartum-care': (
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
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  ),
  lactation: (
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
  'sibling-prep': (
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
  'car-seat-safety': (
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
        d="M8 7h.01M8 11h.01M12 7h.01M12 11h.01M16 7h.01M16 11h.01M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2zM9 19v2m6-2v2"
      />
    </svg>
  ),
  'infant-massage': (
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
}

// Full service descriptions (more detailed than shortDescription in config)
const serviceDescriptions: Record<string, string> = {
  'birth-doula':
    'Continuous physical, emotional, and informational support during labor and delivery. I help you advocate for your birth preferences and provide comfort measures throughout your journey.',
  'postpartum-care':
    'Nurturing support during the fourth trimester. From newborn care education to emotional support and recovery assistance, I help your family adjust to life with your new baby.',
  lactation:
    'Expert guidance to establish and maintain a successful breastfeeding relationship. I provide personalized support for latch issues, supply concerns, and feeding plans.',
  'sibling-prep':
    'Help your older children feel excited and prepared for their new sibling. Age-appropriate education and activities to ease the transition for the whole family.',
  'car-seat-safety':
    'As a certified Child Passenger Safety Technician, I ensure your car seat is installed correctly and your baby travels safely from day one.',
  'infant-massage':
    'Learn gentle massage techniques to soothe your baby, ease gas and colic, improve sleep, and deepen your bond through nurturing touch.',
}

export function ServicesOverview() {
  // Build services array from config + icons + descriptions
  const services = siteConfig.services.map(service => ({
    title: service.name,
    description: serviceDescriptions[service.slug] || '',
    href: `/services/${service.slug}`,
    icon: serviceIcons[service.slug],
  }))

  return (
    <section className={`bg-card ${spacing.container} ${spacing.section.md}`}>
      <div className={`mx-auto ${maxWidth.layout}`}>
        {/* Section Header */}
        <FadeIn>
          <div className={`mx-auto ${maxWidth.article} text-center`}>
            <h2 className={typography.h2}>How I Can Support You</h2>
            <p className={`mt-4 ${typography.lead}`}>
              Comprehensive doula services tailored to your family&apos;s unique
              journey through pregnancy, birth, and beyond.
            </p>
          </div>
        </FadeIn>

        {/* Services Grid */}
        <div className={`mt-16 grid ${grid.gap.medium} ${grid.cols.four}`}>
          {services.map((service, index) => (
            <FadeIn key={service.href} delay={0.1 + index * 0.1}>
              <ServiceCard
                title={service.title}
                description={service.description}
                icon={service.icon}
                href={service.href}
              />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
