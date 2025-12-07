import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { FadeIn } from '@/components/ui/fade-in'

export const metadata: Metadata = {
  title: 'Blog | Nurture Nest Birth | Doula Resources & Birth Tips',
  description:
    'Expert advice on pregnancy, birth, and postpartum from a DONA-certified doula in Kearney, Nebraska. Tips for preparing for birth, choosing a doula, and more.',
  keywords:
    'birth tips, doula advice, pregnancy blog, postpartum tips, Kearney NE doula',
}

const blogPosts = [
  {
    title: 'What Does a Doula Actually Do? A Complete Guide',
    slug: 'what-does-a-doula-do',
    excerpt:
      "Thinking about hiring a doula but not sure what they actually do? Learn about the real role of a doula during pregnancy, birth, and postpartum—and how it's different from a midwife or nurse.",
    date: 'December 6, 2025',
    readTime: '8 min read',
    category: 'Birth Support',
  },
  {
    title: 'How Much Does a Doula Cost? (And Is It Worth It?)',
    slug: 'doula-cost-worth-it',
    excerpt:
      'Breaking down doula fees in Nebraska, what affects pricing, insurance coverage, and why families say hiring a doula was their best birth investment.',
    date: 'December 5, 2025',
    readTime: '7 min read',
    category: 'Planning',
  },
  {
    title: 'Creating a Birth Plan That Actually Works',
    slug: 'birth-plan-tips',
    excerpt:
      'Birth plans can be powerful tools or sources of stress. Learn how to create a flexible, realistic birth plan that helps you communicate your preferences without setting rigid expectations.',
    date: 'December 4, 2025',
    readTime: '10 min read',
    category: 'Birth Preparation',
  },
]

export default function BlogPage() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Blog
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Birth, Postpartum & Doula Resources
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-6 text-xl text-muted-foreground">
              Evidence-based guidance and real talk about pregnancy, birth, and
              the fourth trimester.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post, i) => (
              <FadeIn key={post.slug} delay={i * 0.1}>
                <Link href={`/blog/${post.slug}`} className="block h-full">
                  <Card className="group flex h-full flex-col transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
                    <CardHeader>
                      <div className="mb-3 flex items-center justify-between text-sm">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          {post.category}
                        </span>
                        <span className="text-muted-foreground">
                          {post.readTime}
                        </span>
                      </div>
                      <h2 className="font-serif text-xl font-bold text-foreground group-hover:text-primary">
                        {post.title}
                      </h2>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col">
                      <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                        {post.excerpt}
                      </p>
                      <div className="mt-4 flex items-center text-sm text-muted-foreground">
                        <time>{post.date}</time>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
