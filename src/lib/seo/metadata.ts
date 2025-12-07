import type { Metadata } from 'next'
import { siteConfig } from '@/config/site'

/**
 * SEO Metadata Helpers
 *
 * Utility functions to generate consistent, SEO-optimized metadata
 * across all pages.
 */

interface PageMetadataOptions {
  title: string
  description: string
  keywords?: string[]
  image?: string
  type?: 'website' | 'article'
  publishedTime?: string
  authors?: string[]
  path?: string
}

/**
 * Generate metadata for a page with SEO best practices
 */
export function generateMetadata(options: PageMetadataOptions): Metadata {
  const {
    title,
    description,
    keywords = [],
    image = '/images/hero-newborn.jpg',
    type = 'website',
    publishedTime,
    authors,
    path = '',
  } = options

  const url = `${siteConfig.url.canonical}${path}`

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: authors ? authors.map(name => ({ name })) : undefined,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type,
      locale: 'en_US',
      url,
      siteName: siteConfig.business.name,
      title,
      description,
      images: [
        {
          url: image,
          width: 1920,
          height: 1080,
          alt: `${title} - ${siteConfig.business.name}`,
        },
      ],
      ...(publishedTime && type === 'article' ? { publishedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

/**
 * Generate metadata for service pages
 */
export function generateServiceMetadata(options: {
  serviceName: string
  description: string
  keywords?: string[]
  slug: string
}): Metadata {
  const { serviceName, description, keywords = [], slug } = options

  return generateMetadata({
    title: `${serviceName} | Professional Doula Services`,
    description,
    keywords: [
      ...keywords,
      'doula Kearney NE',
      'DONA certified',
      'Nebraska doula',
    ],
    path: `/services/${slug}`,
    type: 'website',
  })
}

/**
 * Generate metadata for blog posts
 */
export function generateBlogMetadata(options: {
  title: string
  description: string
  keywords?: string[]
  slug: string
  publishedDate: string
  author?: string
}): Metadata {
  const {
    title,
    description,
    keywords = [],
    slug,
    publishedDate,
    author,
  } = options

  return generateMetadata({
    title,
    description,
    keywords: [...keywords, 'doula blog', 'birth education', 'Kearney NE'],
    path: `/blog/${slug}`,
    type: 'article',
    publishedTime: publishedDate,
    authors: author ? [author] : [siteConfig.business.name],
  })
}

/**
 * Validate and clean SEO title (max 60 chars for Google)
 */
export function optimizeSEOTitle(title: string): string {
  if (title.length <= 60) return title
  return title.substring(0, 57) + '...'
}

/**
 * Validate and clean meta description (max 160 chars)
 */
export function optimizeSEODescription(description: string): string {
  if (description.length <= 160) return description
  return description.substring(0, 157) + '...'
}

/**
 * Generate breadcrumb JSON-LD for better SEO
 */
export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url.canonical}${item.url}`,
    })),
  }
}
