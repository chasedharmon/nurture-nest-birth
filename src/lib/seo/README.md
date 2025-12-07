# SEO Utilities

Utilities for generating SEO-optimized metadata across the site.

## Features

- Consistent metadata generation
- Automatic canonical URLs
- Open Graph and Twitter Card support
- SEO title/description optimization
- Breadcrumb schema generation

## Usage

### Basic Page Metadata

```tsx
import { generateMetadata } from '@/lib/seo'

export const metadata = generateMetadata({
  title: 'About Us',
  description: 'Learn about our doula services...',
  keywords: ['about', 'doula', 'Kearney'],
  path: '/about',
})
```

### Service Page Metadata

```tsx
import { generateServiceMetadata } from '@/lib/seo'

export const metadata = generateServiceMetadata({
  serviceName: 'Birth Doula Support',
  description: 'Comprehensive labor and delivery support...',
  keywords: ['birth doula', 'labor support'],
  slug: 'birth-doula',
})
```

### Blog Post Metadata

```tsx
import { generateBlogMetadata } from '@/lib/seo'

export const metadata = generateBlogMetadata({
  title: 'What Does a Doula Do?',
  description: 'Complete guide to doula support...',
  keywords: ['doula role', 'birth support'],
  slug: 'what-does-a-doula-do',
  publishedDate: '2025-12-06',
  author: 'Nurture Nest Birth',
})
```

### Breadcrumb Schema

```tsx
import { generateBreadcrumbSchema } from '@/lib/seo'
import { JSONLDScript } from '@/lib/schema'

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Services', url: '/services' },
  { name: 'Birth Doula', url: '/services/birth-doula' },
])

<JSONLDScript data={breadcrumbs} />
```

## SEO Best Practices

### Title Length

- Keep titles under 60 characters
- Use `optimizeSEOTitle()` to automatically truncate

### Description Length

- Keep descriptions under 160 characters
- Use `optimizeSEODescription()` to automatically truncate

### Canonical URLs

- All pages automatically include canonical URLs
- Prevents duplicate content issues

### Open Graph Images

- Default: `/images/hero-newborn.jpg`
- Custom images can be specified per page
- Fallback: Dynamic OG image generation

## Verification

To verify SEO implementation:

1. Check robots.txt: `/robots.txt`
2. Check sitemap: `/sitemap.xml`
3. Check OG image: `/opengraph-image`
4. Use [Meta Tags](https://metatags.io/) to preview social cards
5. Use Google's [Rich Results Test](https://search.google.com/test/rich-results)
