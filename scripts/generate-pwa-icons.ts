/**
 * PWA Icon Generator Script
 *
 * Generates all required PWA icon sizes from a source image.
 * Run with: npx ts-node scripts/generate-pwa-icons.ts
 *
 * Requirements:
 * - Place a 1024x1024 PNG source image at public/icons/icon-source.png
 * - Install sharp: pnpm add -D sharp @types/sharp
 *
 * Output:
 * - Standard icons: 72, 96, 128, 144, 152, 192, 384, 512px
 * - Apple touch icons: 180px
 * - Shortcut icons: 96px with rounded corners
 * - Badge icon: 72px monochrome
 * - Favicon: 32px
 */

import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

const ICONS_DIR = path.join(process.cwd(), 'public/icons')
const SOURCE_IMAGE = path.join(ICONS_DIR, 'icon-source.png')

// Standard PWA icon sizes
const STANDARD_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

// Apple-specific sizes
const APPLE_SIZES = [180]

// Shortcut icon size
const SHORTCUT_SIZE = 96

// Badge size (for notifications)
const BADGE_SIZE = 72

// Favicon size
const FAVICON_SIZE = 32

async function generateIcons() {
  // Check if source image exists
  if (!fs.existsSync(SOURCE_IMAGE)) {
    console.log('Source image not found. Creating placeholder icons...')
    await generatePlaceholderIcons()
    return
  }

  const sourceBuffer = await sharp(SOURCE_IMAGE).toBuffer()

  console.log('Generating PWA icons from source image...')

  // Generate standard icons
  for (const size of STANDARD_SIZES) {
    await sharp(sourceBuffer)
      .resize(size, size)
      .png({ quality: 90 })
      .toFile(path.join(ICONS_DIR, `icon-${size}x${size}.png`))
    console.log(`  ✓ icon-${size}x${size}.png`)
  }

  // Generate Apple touch icon
  for (const size of APPLE_SIZES) {
    await sharp(sourceBuffer)
      .resize(size, size)
      .png({ quality: 90 })
      .toFile(path.join(ICONS_DIR, `apple-touch-icon.png`))
    console.log(`  ✓ apple-touch-icon.png (${size}x${size})`)
  }

  // Generate shortcut icons with slight rounding
  const shortcuts = ['dashboard', 'clients', 'calendar']
  for (const shortcut of shortcuts) {
    await sharp(sourceBuffer)
      .resize(SHORTCUT_SIZE, SHORTCUT_SIZE)
      .png({ quality: 90 })
      .toFile(path.join(ICONS_DIR, `shortcut-${shortcut}.png`))
    console.log(`  ✓ shortcut-${shortcut}.png`)
  }

  // Generate badge icon (monochrome for notifications)
  await sharp(sourceBuffer)
    .resize(BADGE_SIZE, BADGE_SIZE)
    .grayscale()
    .png({ quality: 90 })
    .toFile(path.join(ICONS_DIR, `badge-${BADGE_SIZE}x${BADGE_SIZE}.png`))
  console.log(`  ✓ badge-${BADGE_SIZE}x${BADGE_SIZE}.png`)

  // Generate favicon
  await sharp(sourceBuffer)
    .resize(FAVICON_SIZE, FAVICON_SIZE)
    .png({ quality: 90 })
    .toFile(path.join(ICONS_DIR, `favicon-${FAVICON_SIZE}x${FAVICON_SIZE}.png`))
  console.log(`  ✓ favicon-${FAVICON_SIZE}x${FAVICON_SIZE}.png`)

  console.log('\n✅ All icons generated successfully!')
}

/**
 * Generate placeholder icons when no source image is available.
 * Creates simple colored squares with "NNB" text.
 */
async function generatePlaceholderIcons() {
  const backgroundColor = '#8B4513' // Saddle brown (brand color)
  const textColor = '#FFFFFF'

  const allSizes = [
    ...STANDARD_SIZES,
    ...APPLE_SIZES,
    BADGE_SIZE,
    FAVICON_SIZE,
    SHORTCUT_SIZE,
  ]

  for (const size of [...new Set(allSizes)]) {
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${backgroundColor}" rx="${size * 0.1}"/>
        <text
          x="50%"
          y="50%"
          font-family="Arial, sans-serif"
          font-size="${size * 0.3}px"
          font-weight="bold"
          fill="${textColor}"
          text-anchor="middle"
          dominant-baseline="central"
        >NNB</text>
      </svg>
    `

    // Standard icons
    if (STANDARD_SIZES.includes(size)) {
      await sharp(Buffer.from(svg))
        .png()
        .toFile(path.join(ICONS_DIR, `icon-${size}x${size}.png`))
      console.log(`  ✓ icon-${size}x${size}.png (placeholder)`)
    }

    // Apple touch icon
    if (size === 180) {
      await sharp(Buffer.from(svg))
        .png()
        .toFile(path.join(ICONS_DIR, `apple-touch-icon.png`))
      console.log(`  ✓ apple-touch-icon.png (placeholder)`)
    }

    // Badge icon
    if (size === BADGE_SIZE) {
      await sharp(Buffer.from(svg))
        .png()
        .toFile(path.join(ICONS_DIR, `badge-${size}x${size}.png`))
      console.log(`  ✓ badge-${size}x${size}.png (placeholder)`)
    }

    // Favicon
    if (size === FAVICON_SIZE) {
      await sharp(Buffer.from(svg))
        .png()
        .toFile(path.join(ICONS_DIR, `favicon-${size}x${size}.png`))
      console.log(`  ✓ favicon-${size}x${size}.png (placeholder)`)
    }
  }

  // Shortcut icons
  const shortcuts = ['dashboard', 'clients', 'calendar']
  const shortcutSvg = `
    <svg width="${SHORTCUT_SIZE}" height="${SHORTCUT_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${backgroundColor}" rx="${SHORTCUT_SIZE * 0.1}"/>
      <text
        x="50%"
        y="50%"
        font-family="Arial, sans-serif"
        font-size="${SHORTCUT_SIZE * 0.3}px"
        font-weight="bold"
        fill="${textColor}"
        text-anchor="middle"
        dominant-baseline="central"
      >NNB</text>
    </svg>
  `

  for (const shortcut of shortcuts) {
    await sharp(Buffer.from(shortcutSvg))
      .png()
      .toFile(path.join(ICONS_DIR, `shortcut-${shortcut}.png`))
    console.log(`  ✓ shortcut-${shortcut}.png (placeholder)`)
  }

  console.log('\n✅ Placeholder icons generated!')
  console.log(
    '📝 To use custom icons, place a 1024x1024 PNG at public/icons/icon-source.png and run this script again.'
  )
}

// Run the generator
generateIcons().catch(console.error)
