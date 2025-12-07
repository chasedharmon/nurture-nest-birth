import { Card, CardContent } from '@/components/ui/card'
import type { Testimonial } from '@/config/site'

interface TestimonialCardProps {
  testimonial: Testimonial
}

/**
 * Testimonial Card Component
 *
 * Displays a single client testimonial with rating, quote, and client info.
 * Used in testimonials section and can be reused anywhere.
 */
export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <Card className="h-full border-2 transition-all duration-300 hover:border-primary/30 hover:shadow-lg">
      <CardContent className="flex h-full flex-col p-6">
        {/* Star Rating */}
        <div className="mb-4 flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              className={`h-5 w-5 ${
                i < testimonial.rating
                  ? 'text-accent fill-accent'
                  : 'text-muted-foreground/30'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>

        {/* Quote */}
        <blockquote className="flex-1">
          <p className="text-base leading-relaxed text-foreground">
            &ldquo;{testimonial.quote}&rdquo;
          </p>
        </blockquote>

        {/* Client Info */}
        <div className="mt-6 border-t border-border pt-4">
          <p className="font-semibold text-foreground">{testimonial.name}</p>
          <p className="text-sm text-muted-foreground">
            {testimonial.location} • {testimonial.service}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
