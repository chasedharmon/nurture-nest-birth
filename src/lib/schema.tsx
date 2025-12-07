import type {
  WithContext,
  LocalBusiness,
  Organization,
  Article,
  Service,
  FAQPage,
} from 'schema-dts'
import { siteConfig } from '@/config/site'

/**
 * Schema.org JSON-LD generators for SEO
 * Based on 2025 doula marketing best practices
 */

export function getOrganizationSchema(): WithContext<Organization> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.business.name,
    description: siteConfig.business.description,
    url: siteConfig.url.canonical,
    logo: `${siteConfig.url.canonical}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      email: siteConfig.contact.email,
      contactType: 'customer service',
      areaServed: siteConfig.location.serviceArea,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: siteConfig.location.city,
      addressRegion: siteConfig.location.state,
      addressCountry: 'US',
    },
    sameAs: Object.values(siteConfig.social),
  }
}

export function getLocalBusinessSchema(): WithContext<LocalBusiness> {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': siteConfig.url.canonical,
    name: siteConfig.business.name,
    description: siteConfig.business.description,
    url: siteConfig.url.canonical,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    image: `${siteConfig.url.canonical}/images/og-image.jpg`,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: siteConfig.location.city,
      addressRegion: siteConfig.location.state,
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 40.7,
      longitude: -99.08,
    },
    areaServed: siteConfig.location.serviceArea.map(area => ({
      '@type': 'City',
      name: area,
    })),
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '17:00',
    },
    sameAs: Object.values(siteConfig.social),
  }
}

export function getArticleSchema(article: {
  title: string
  description: string
  datePublished: string
  dateModified?: string
  slug: string
  imageUrl?: string
}): WithContext<Article> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image:
      article.imageUrl || `${siteConfig.url.canonical}/images/og-image.jpg`,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      '@type': 'Person',
      name: siteConfig.business.name,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.business.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url.canonical}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteConfig.url.canonical}/blog/${article.slug}`,
    },
  }
}

export function getServiceSchema(service: {
  name: string
  description: string
  priceRange?: string
  slug: string
}): WithContext<Service> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'Organization',
      name: siteConfig.business.name,
      address: {
        '@type': 'PostalAddress',
        addressLocality: siteConfig.location.city,
        addressRegion: siteConfig.location.state,
        addressCountry: 'US',
      },
    },
    areaServed: siteConfig.location.serviceArea.map(area => ({
      '@type': 'City',
      name: area,
    })),
    ...(service.priceRange && { priceRange: service.priceRange }),
    url: `${siteConfig.url.canonical}/services/${service.slug}`,
  }
}

export function getFAQSchema(
  faqs: Array<{ question: string; answer: string }>
): WithContext<FAQPage> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/**
 * Component to inject JSON-LD structured data into page head
 */
export function JSONLDScript<T>({ data }: { data: WithContext<T> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
