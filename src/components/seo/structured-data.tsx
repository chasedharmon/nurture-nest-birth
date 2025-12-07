import { siteConfig } from '@/config/site'

/**
 * Structured Data Components (JSON-LD)
 *
 * These components generate JSON-LD markup for search engines.
 * All data comes from @/config/site.ts for easy maintenance.
 */

export function LocalBusinessStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': siteConfig.url.canonical,
    name: siteConfig.business.name,
    description: siteConfig.business.description,
    url: siteConfig.url.canonical,
    telephone: siteConfig.contact.phoneFormatted,
    email: siteConfig.contact.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: siteConfig.location.city,
      addressRegion: siteConfig.location.stateAbbr,
      postalCode: siteConfig.location.zipCode,
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: siteConfig.location.coordinates.latitude,
      longitude: siteConfig.location.coordinates.longitude,
    },
    areaServed: siteConfig.location.serviceArea.map(city => ({
      '@type': 'City',
      name: city,
    })),
    priceRange: '$$',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Doula Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Birth Doula Support',
            description:
              'Comprehensive labor and delivery support with prenatal visits and postpartum follow-up',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Postpartum Care',
            description:
              'In-home fourth trimester support with newborn care and feeding assistance',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Lactation Consulting',
            description:
              'Expert breastfeeding support from a Certified Lactation Consultant',
          },
        },
      ],
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

export function OrganizationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.business.name,
    url: siteConfig.url.canonical,
    logo: `${siteConfig.url.canonical}/images/hero-newborn.jpg`,
    description: siteConfig.business.description,
    sameAs: Object.values(siteConfig.social).filter(Boolean), // Only include non-empty social links
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
