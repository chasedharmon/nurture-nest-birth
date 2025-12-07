import { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'

/**
 * Next.js Sitemap Generation
 *
 * Automatically generates sitemap.xml at /sitemap.xml
 * To add new pages: just add them to the routes array below
 */

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url.canonical

  // Static routes - add new pages here as you create them
  const routes = [
    '',
    '/about',
    '/services',
    '/services/birth-doula',
    '/services/postpartum-care',
    '/services/lactation',
    '/services/sibling-prep',
    '/pricing',
    '/blog',
    '/blog/what-does-a-doula-do',
    '/blog/doula-cost-worth-it',
    '/blog/birth-plan-tips',
    '/testimonials',
    '/faq',
    '/contact',
  ]

  return routes.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: getChangeFrequency(route),
    priority: getPriority(route),
  }))
}

/**
 * Determine how often a page changes
 * Helps search engines know how often to re-crawl
 */
function getChangeFrequency(
  route: string
): 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' {
  // Homepage and blog change most frequently
  if (route === '' || route === '/blog') return 'weekly'

  // Blog posts change occasionally (updates/corrections)
  if (route.startsWith('/blog/')) return 'monthly'

  // Service and info pages change less frequently
  if (route.startsWith('/services') || route === '/pricing') return 'monthly'

  // Static pages rarely change
  return 'yearly'
}

/**
 * Determine page priority (0.0 to 1.0)
 * Helps search engines understand which pages are most important
 */
function getPriority(route: string): number {
  // Homepage is highest priority
  if (route === '') return 1.0

  // Service pages are very important (these convert visitors)
  if (route.startsWith('/services/')) return 0.9

  // Services index, pricing, contact are high priority
  if (route === '/services' || route === '/pricing' || route === '/contact') {
    return 0.8
  }

  // About, FAQ, testimonials are important
  if (route === '/about' || route === '/faq' || route === '/testimonials') {
    return 0.7
  }

  // Blog index is moderately important
  if (route === '/blog') return 0.6

  // Individual blog posts are lower priority
  if (route.startsWith('/blog/')) return 0.5

  // Default priority
  return 0.5
}
