# Analytics Tracking

This directory contains analytics event tracking utilities that work with Vercel Analytics.

## Features

- Type-safe event tracking
- Automatic integration with Vercel Analytics
- Development mode logging
- Zero external dependencies (beyond Vercel Analytics)

## Usage

### Basic Event Tracking

```tsx
import { trackEvent, EVENTS } from '@/lib/analytics'

// Track a custom event
trackEvent(EVENTS.CTA_CLICK, {
  cta_text: 'Schedule Consultation',
  cta_location: 'hero',
})
```

### Contact Form Tracking

The contact form automatically tracks:

- Form submissions
- Successful submissions
- Form errors

```tsx
import { trackContactFormSubmit } from '@/lib/analytics'

trackContactFormSubmit({ service: 'birth-doula' })
```

### Page View Tracking

Use the `PageViewTracker` component to track page views:

```tsx
import { PageViewTracker } from '@/components/analytics'
import { EVENTS } from '@/lib/analytics'

export default function Page() {
  return (
    <div>
      <PageViewTracker
        eventName={EVENTS.SERVICE_PAGE_VIEW}
        properties={{ service: 'birth-doula' }}
      />
      {/* Your page content */}
    </div>
  )
}
```

### Tracked Links (CTA Buttons)

Use `TrackedLink` to automatically track CTA clicks:

```tsx
import { TrackedLink } from '@/components/analytics'

;<TrackedLink
  href="/contact"
  ctaText="Schedule Consultation"
  ctaLocation="hero"
>
  Schedule Consultation
</TrackedLink>
```

## Viewing Analytics

1. **Development**: Events are logged to the console
2. **Production**: View events in your Vercel Analytics dashboard

## Adding New Events

1. Add the event name to `EVENTS` in `events.ts`
2. Optionally create a helper function for the event
3. Use the event throughout your application

## Future Integrations

The logger is designed to easily integrate with external services:

- Sentry for error tracking
- LogRocket for session replay
- Google Analytics
- Mixpanel, Amplitude, etc.

Just uncomment the relevant sections in `events.ts` and add your API keys.
