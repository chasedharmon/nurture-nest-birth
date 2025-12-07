/**
 * Reading Time Calculator
 *
 * Calculates estimated reading time for blog content.
 * Based on average reading speed of 200-250 words per minute.
 */

const WORDS_PER_MINUTE = 225

/**
 * Calculate reading time from text content
 */
export function calculateReadingTime(text: string): {
  minutes: number
  words: number
  text: string
} {
  // Remove code blocks and HTML tags for more accurate count
  const cleanText = text
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()

  // Count words
  const words = cleanText.split(/\s+/).length

  // Calculate minutes (minimum 1 minute)
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))

  // Generate human-readable text
  const readingTimeText = `${minutes} min read`

  return {
    minutes,
    words,
    text: readingTimeText,
  }
}

/**
 * Calculate reading time from React children (for MDX content)
 */
export function calculateReadingTimeFromChildren(children: React.ReactNode): {
  minutes: number
  text: string
} {
  // Extract text content from React children
  const extractText = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node
    if (typeof node === 'number') return String(node)
    if (Array.isArray(node)) return node.map(extractText).join(' ')
    if (node && typeof node === 'object' && 'props' in node) {
      const props = (node as { props: { children?: React.ReactNode } }).props
      return extractText(props.children)
    }
    return ''
  }

  const text = extractText(children)
  return calculateReadingTime(text)
}

/**
 * Format reading time for display
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 1) return '< 1 min read'
  if (minutes === 1) return '1 min read'
  return `${minutes} min read`
}
