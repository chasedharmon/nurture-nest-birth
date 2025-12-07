import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * Related Posts Component
 *
 * Shows related blog posts to encourage further reading
 */

interface Post {
  title: string
  slug: string
  excerpt: string
  category: string
  readingTime: number
}

interface RelatedPostsProps {
  posts: Post[]
  currentSlug?: string
}

export function RelatedPosts({ posts, currentSlug }: RelatedPostsProps) {
  // Filter out current post
  const filteredPosts = currentSlug
    ? posts.filter(post => post.slug !== currentSlug)
    : posts

  // Take first 3 posts
  const displayPosts = filteredPosts.slice(0, 3)

  if (displayPosts.length === 0) {
    return null
  }

  return (
    <section className="bg-muted/30 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-8 text-center font-serif text-3xl font-bold">
          Related Articles
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {displayPosts.map(post => (
            <Card key={post.slug} className="flex flex-col">
              <CardHeader>
                <div className="mb-2 flex items-center gap-2 text-sm">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {post.category}
                  </span>
                  <span className="text-muted-foreground">
                    {post.readingTime} min read
                  </span>
                </div>
                <CardTitle className="line-clamp-2 font-serif text-xl">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="hover:text-primary"
                  >
                    {post.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-grow flex-col">
                <p className="mb-4 flex-grow text-sm text-muted-foreground line-clamp-3">
                  {post.excerpt}
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/blog/${post.slug}`}>Read More</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
