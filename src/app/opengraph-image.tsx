import { ImageResponse } from 'next/og'
import { siteConfig } from '@/config/site'

/**
 * Dynamic Open Graph Image Generation
 *
 * Generates a default OG image for pages that don't have a custom image.
 * Uses Next.js's ImageResponse API to create images on the fly.
 *
 * Size: 1200x630 (recommended by Facebook/Twitter)
 */

export const runtime = 'edge'
export const alt =
  'Nurture Nest Birth - DONA-Certified Doula in Kearney, Nebraska'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f9f7f4 0%, #ede8e0 100%)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Brand Name */}
      <div
        style={{
          display: 'flex',
          fontSize: 72,
          fontWeight: 700,
          color: '#6b7c5a',
          marginBottom: 20,
          fontFamily: 'Georgia, serif',
        }}
      >
        {siteConfig.business.name}
      </div>

      {/* Tagline */}
      <div
        style={{
          display: 'flex',
          fontSize: 32,
          color: '#5a5a5a',
          textAlign: 'center',
          maxWidth: '80%',
        }}
      >
        DONA-Certified Doula in Kearney, Nebraska
      </div>

      {/* Services */}
      <div
        style={{
          display: 'flex',
          fontSize: 24,
          color: '#8a8a8a',
          marginTop: 30,
        }}
      >
        Birth Support • Postpartum Care • Lactation
      </div>

      {/* Bottom Badge */}
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          bottom: 40,
          fontSize: 20,
          color: '#6b7c5a',
          background: 'rgba(107, 124, 90, 0.1)',
          padding: '12px 24px',
          borderRadius: 9999,
        }}
      >
        Compassionate, Evidence-Based Care
      </div>
    </div>,
    {
      ...size,
    }
  )
}
