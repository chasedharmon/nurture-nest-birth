/**
 * Blog Posts Data
 *
 * Central repository for blog post metadata.
 * In a real app, this would come from a CMS or markdown files.
 */

export interface BlogPost {
  title: string
  slug: string
  excerpt: string
  category: string
  readingTime: number
  publishedDate: string
  author: string
}

export const blogPosts: BlogPost[] = [
  {
    title: 'What Does a Doula Actually Do? A Complete Guide',
    slug: 'what-does-a-doula-do',
    excerpt:
      'Wondering what a doula actually does? Learn about doula support during pregnancy, labor, birth, and postpartum.',
    category: 'Birth Support',
    readingTime: 8,
    publishedDate: '2025-12-06',
    author: 'Nurture Nest Birth',
  },
  {
    title: 'Is Hiring a Doula Worth the Cost?',
    slug: 'doula-cost-worth-it',
    excerpt:
      'Explore the real value of doula care and how it can improve your birth experience and outcomes.',
    category: 'Planning',
    readingTime: 6,
    publishedDate: '2025-12-06',
    author: 'Nurture Nest Birth',
  },
  {
    title: 'Creating an Effective Birth Plan: Tips from a Doula',
    slug: 'birth-plan-tips',
    excerpt:
      'Learn how to create a birth plan that communicates your wishes while remaining flexible.',
    category: 'Birth Planning',
    readingTime: 7,
    publishedDate: '2025-12-06',
    author: 'Nurture Nest Birth',
  },
  {
    title: "Sarah's Home Birth Story: A Journey of Strength and Support",
    slug: 'sarah-home-birth-story',
    excerpt:
      'A first-time mom shares her empowering home birth experience with continuous doula support.',
    category: 'Birth Stories',
    readingTime: 10,
    publishedDate: '2025-12-05',
    author: 'Nurture Nest Birth',
  },
  {
    title: "From Hospital to Home: Emma's VBAC Success Story",
    slug: 'emma-vbac-story',
    excerpt:
      'After a cesarean with her first baby, Emma achieved her dream of a vaginal birth with doula support.',
    category: 'Birth Stories',
    readingTime: 12,
    publishedDate: '2025-12-04',
    author: 'Nurture Nest Birth',
  },
]

/**
 * Get all blog posts
 */
export function getAllPosts(): BlogPost[] {
  return blogPosts
}

/**
 * Get a single post by slug
 */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find(post => post.slug === slug)
}

/**
 * Get related posts (excluding current post)
 */
export function getRelatedPosts(currentSlug: string, limit = 3): BlogPost[] {
  return blogPosts.filter(post => post.slug !== currentSlug).slice(0, limit)
}

/**
 * Get all unique categories
 */
export function getAllCategories(): string[] {
  const categories = blogPosts.map(post => post.category)
  return Array.from(new Set(categories)).sort()
}

/**
 * Get posts by category
 */
export function getPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter(post => post.category === category)
}
