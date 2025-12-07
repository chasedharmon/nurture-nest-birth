export function LocalBusinessStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://nurturenestbirth.com',
    name: 'Nurture Nest Birth',
    description:
      'DONA-certified doula providing birth support, postpartum care, and lactation consulting in Kearney, Nebraska.',
    url: 'https://nurturenestbirth.com',
    telephone: '', // Add when available
    email: '', // Add when available
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Kearney',
      addressRegion: 'NE',
      postalCode: '68847',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 40.6993,
      longitude: -99.0817,
    },
    areaServed: [
      {
        '@type': 'City',
        name: 'Kearney',
        '@id': 'https://en.wikipedia.org/wiki/Kearney,_Nebraska',
      },
      {
        '@type': 'City',
        name: 'Grand Island',
        '@id': 'https://en.wikipedia.org/wiki/Grand_Island,_Nebraska',
      },
      {
        '@type': 'City',
        name: 'Hastings',
        '@id': 'https://en.wikipedia.org/wiki/Hastings,_Nebraska',
      },
    ],
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
    name: 'Nurture Nest Birth',
    url: 'https://nurturenestbirth.com',
    logo: 'https://nurturenestbirth.com/images/hero-newborn.jpg',
    description:
      'DONA-certified doula providing compassionate birth and postpartum support in central Nebraska',
    sameAs: [
      // Add social media links when available
      // 'https://www.facebook.com/nurturenestbirth',
      // 'https://www.instagram.com/nurturenestbirth',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
