import { Metadata } from 'next'
import { siteConfig } from '@/config/site'

/**
 * Metadata Helper Utilities
 *
 * Consistent metadata generation for SEO and OpenGraph tags.
 * Use these helpers in each page's metadata export for consistency.
 */

interface PageMetadataProps {
  title: string
  description: string
  path?: string
  keywords?: string[]
  image?: string
  type?: 'website' | 'article'
  publishedTime?: string
  author?: string
}

/**
 * Generate consistent metadata for any page
 *
 * @example
 * export const metadata = generateMetadata({
 *   title: 'About',
 *   description: 'Learn about our professional doula services',
 *   path: '/about',
 * })
 */
export function generateMetadata({
  title,
  description,
  path = '',
  keywords = [],
  image,
  type = 'website',
  publishedTime,
  author,
}: PageMetadataProps): Metadata {
  const url = `${siteConfig.url.canonical}${path}`
  const ogImage = image || siteConfig.seo.ogImage

  // Combine page-specific keywords with site-wide keywords
  const allKeywords = [...siteConfig.seo.keywords, ...keywords]

  return {
    title,
    description,
    keywords: allKeywords.join(', '),
    authors: author ? [{ name: author }] : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.business.name,
      images: [
        {
          url: `${siteConfig.url.canonical}${ogImage}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
      type,
      ...(publishedTime && { publishedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteConfig.url.canonical}${ogImage}`],
      creator: siteConfig.seo.twitterHandle,
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

/**
 * Generate metadata for blog posts
 *
 * @example
 * export const metadata = generateBlogMetadata({
 *   title: 'What Does a Doula Do?',
 *   description: 'Complete guide to doula support...',
 *   slug: 'what-does-a-doula-do',
 *   publishedTime: '2025-12-06',
 * })
 */
export function generateBlogMetadata({
  title,
  description,
  slug,
  keywords = [],
  image,
  publishedTime,
  author = siteConfig.business.owner,
}: Omit<PageMetadataProps, 'path' | 'type'> & { slug: string }): Metadata {
  return generateMetadata({
    title: `${title} | ${siteConfig.business.name} Blog`,
    description,
    path: `/blog/${slug}`,
    keywords,
    image,
    type: 'article',
    publishedTime,
    author,
  })
}

/**
 * Generate metadata for service pages
 *
 * @example
 * export const metadata = generateServiceMetadata({
 *   title: 'Birth Doula Services',
 *   description: 'Comprehensive labor support...',
 *   slug: 'birth-doula',
 * })
 */
export function generateServiceMetadata({
  title,
  description,
  slug,
  keywords = [],
  image,
}: Omit<PageMetadataProps, 'path' | 'type'> & { slug: string }): Metadata {
  return generateMetadata({
    title: `${title} | ${siteConfig.business.name}`,
    description,
    path: `/services/${slug}`,
    keywords: [
      ...keywords,
      'doula services',
      `${siteConfig.location.city} ${siteConfig.location.stateAbbr}`,
    ],
    image,
  })
}
