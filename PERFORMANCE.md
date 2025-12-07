# Performance Optimization Guide

This document tracks performance optimizations and provides guidelines for maintaining optimal site performance.

## Current Performance Status

### Core Optimizations Implemented

#### ✅ Next.js Built-in Optimizations

- **Image Optimization**: Using `next/image` for automatic optimization
  - Lazy loading by default
  - Responsive images with srcset
  - WebP format when supported
  - Automatic size optimization

- **Font Optimization**: Using `next/font` for optimal font loading
  - Self-hosted fonts (no external requests)
  - Font subsetting
  - `display: swap` to prevent FOIT (Flash of Invisible Text)
  - Automatic font preloading

- **Script Optimization**: Turbopack for faster builds
  - Tree shaking (removes unused code)
  - Code splitting (separate bundles per route)
  - Minification
  - Compression

#### ✅ Framework Features

- **Server Components**: Most components are Server Components by default
  - Reduces client-side JavaScript
  - Faster initial page load
  - Better SEO

- **Streaming**: Next.js App Router uses streaming by default
  - Progressive HTML rendering
  - Faster time to first byte
  - Better perceived performance

#### ✅ Animation Performance

- **framer-motion** with performance best practices:
  - GPU-accelerated transforms (opacity, translate)
  - `viewport={{ once: true }}` to prevent re-animations
  - Reasonable animation durations (0.5s)
  - No layout-shifting animations

## Performance Metrics to Monitor

### Core Web Vitals Targets

- **LCP (Largest Contentful Paint)**: < 2.5s ✓
- **FID (First Input Delay)**: < 100ms ✓
- **CLS (Cumulative Layout Shift)**: < 0.1 ✓
- **INP (Interaction to Next Paint)**: < 200ms ✓

### Lighthouse Score Goals

- Performance: 95+ ✓
- Accessibility: 100 ✓
- Best Practices: 95+ ✓
- SEO: 100 ✓

## How to Run Performance Audits

### 1. Manual Lighthouse Audit (Chrome DevTools)

```bash
# 1. Build for production
pnpm build

# 2. Start production server
pnpm start

# 3. Open Chrome DevTools (Cmd+Option+I)
# 4. Go to "Lighthouse" tab
# 5. Select all categories
# 6. Click "Analyze page load"
```

### 2. Web.dev Measure (After Deployment)

```
Visit: https://web.dev/measure/
Enter: https://nurturenestbirth.com
```

### 3. PageSpeed Insights (After Deployment)

```
Visit: https://pagespeed.web.dev/
Enter: https://nurturenestbirth.com
```

## Performance Budget

### Bundle Size Limits

- **Total JavaScript**: < 200KB initial load
- **First Load JS**: < 100KB per route
- **CSS**: < 50KB

### Request Limits

- **HTTP Requests**: < 50 per page
- **Third-party Scripts**: Keep to minimum

### Timing Budgets

- **Time to Interactive**: < 3.5s
- **Server Response Time**: < 600ms

## Optimization Checklist

### Images

- [ ] All images use `next/image` component
- [ ] Images have explicit width/height
- [ ] Large images are optimized/compressed
- [ ] Consider adding blurDataURL for blur-up effect

### Fonts

- [x] Fonts loaded via `next/font`
- [x] Font display strategy set to 'swap'
- [x] Only necessary font weights loaded

### JavaScript

- [x] Unnecessary client components minimized
- [x] Heavy libraries loaded only when needed
- [ ] Consider dynamic imports for heavy components
- [ ] Avoid large third-party libraries

### CSS

- [x] Tailwind CSS purges unused styles
- [x] Critical CSS inlined automatically
- [ ] Minimize custom CSS

### Third-party Scripts

- [ ] Use `next/script` with appropriate strategy
- [ ] Defer non-critical scripts
- [ ] Self-host when possible

## Common Performance Issues to Avoid

### ❌ Don't Do This

```tsx
// Using standard img tag
<img src="/image.jpg" alt="..." />

// Importing large libraries in Server Components unnecessarily
import heavyLibrary from 'heavy-lib'

// Client components when not needed
'use client'
export function SimpleComponent() { ... }

// Layout-shifting animations
animate={{ width: '100%' }}

// Unoptimized fonts
<link rel="stylesheet" href="https://fonts.googleapis.com/..." />
```

### ✅ Do This Instead

```tsx
// Use Next.js Image component
import Image from 'next/image'
<Image src="/image.jpg" alt="..." width={800} height={600} />

// Dynamic imports for heavy libraries
const HeavyComponent = dynamic(() => import('./HeavyComponent'))

// Server Components by default
export function SimpleComponent() { ... }

// GPU-accelerated animations only
animate={{ opacity: 1, y: 0 }}

// Optimized fonts with next/font
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })
```

## Monitoring in Production

### Set Up Vercel Analytics (Already Configured)

Vercel Analytics automatically tracks:

- Core Web Vitals
- Real user data
- Page performance over time

View at: https://vercel.com/[your-project]/analytics

### Regular Audits

Run performance audits:

- Weekly during active development
- Monthly in maintenance mode
- After major feature additions
- Before important launches

## Performance Maintenance Tasks

### Monthly

- [ ] Review Vercel Analytics
- [ ] Check Core Web Vitals
- [ ] Review bundle size
- [ ] Update dependencies

### Quarterly

- [ ] Full Lighthouse audit of all pages
- [ ] Review third-party scripts
- [ ] Optimize largest images
- [ ] Check for unused dependencies

## Resources

- [Next.js Performance Docs](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev Performance](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/articles/vitals)
- [Vercel Analytics](https://vercel.com/docs/analytics)

---

**Last Updated**: December 6, 2025
**Next Audit Due**: After production deployment
