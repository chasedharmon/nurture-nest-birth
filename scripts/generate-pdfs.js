/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * PDF Resource Generator for Nurture Nest Birth
 *
 * Generates professional lead magnet PDFs for the resources page.
 * Run with: node scripts/generate-pdfs.js
 */

const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

// Brand colors
const colors = {
  primary: '#7c3aed', // Purple
  primaryLight: '#a78bfa',
  secondary: '#f59e0b', // Amber
  text: '#1f2937',
  textMuted: '#6b7280',
  background: '#ffffff',
  accent: '#fef3c7',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
}

// Common PDF setup
function createPDF(filename) {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    info: {
      Title: filename.replace(/-/g, ' ').replace('.pdf', ''),
      Author: 'Nurture Nest Birth',
      Creator: 'Nurture Nest Birth',
    },
  })

  const outputPath = path.join(__dirname, '../public/resources', filename)
  doc.pipe(fs.createWriteStream(outputPath))

  return doc
}

// Add header to each page
function addHeader(doc, _title) {
  doc
    .fillColor(colors.primary)
    .fontSize(10)
    .text('NURTURE NEST BIRTH', 60, 30)
    .fillColor(colors.textMuted)
    .text('nurturenestbirth.com', 400, 30, { align: 'right' })
    .moveTo(60, 50)
    .lineTo(552, 50)
    .strokeColor(colors.primaryLight)
    .stroke()

  doc.moveDown(2)
}

// Add footer to each page
function addFooter(doc, pageNum) {
  const y = doc.page.height - 40
  doc
    .fillColor(colors.textMuted)
    .fontSize(8)
    .text(
      `Page ${pageNum} | Free Resource from Nurture Nest Birth | Central Nebraska Doula Services`,
      60,
      y,
      { align: 'center', width: 492 }
    )
}

// Add title section
function addTitle(doc, title, subtitle) {
  doc
    .fillColor(colors.primary)
    .fontSize(28)
    .font('Helvetica-Bold')
    .text(title, { align: 'center' })

  if (subtitle) {
    doc
      .moveDown(0.5)
      .fillColor(colors.textMuted)
      .fontSize(14)
      .font('Helvetica')
      .text(subtitle, { align: 'center' })
  }

  doc.moveDown(2)
}

// Add section heading
function addSection(doc, title) {
  doc
    .moveDown(1)
    .fillColor(colors.primary)
    .fontSize(16)
    .font('Helvetica-Bold')
    .text(title)
    .moveDown(0.5)
    .fillColor(colors.text)
    .font('Helvetica')
    .fontSize(11)
}

// Add checklist item
function addCheckbox(doc, text, indent = 0) {
  const x = 60 + indent * 20
  const y = doc.y

  doc
    .rect(x, y + 2, 12, 12)
    .strokeColor(colors.primary)
    .stroke()
    .fillColor(colors.text)
    .fontSize(11)
    .text(text, x + 20, y, { width: 472 - indent * 20 })
    .moveDown(0.3)
}

// Add bullet point
function addBullet(doc, text, indent = 0) {
  const x = 60 + indent * 20
  doc
    .fillColor(colors.primary)
    .fontSize(11)
    .text('•', x, doc.y)
    .fillColor(colors.text)
    .text(text, x + 15, doc.y - 13, { width: 477 - indent * 20 })
    .moveDown(0.3)
}

// Add note/callout box
function addCallout(doc, text, type = 'info') {
  const bgColors = {
    info: '#ede9fe',
    warning: '#fef3c7',
    success: '#d1fae5',
    tip: '#e0f2fe',
  }
  const borderColors = {
    info: colors.primary,
    warning: colors.warning,
    success: colors.success,
    tip: '#0284c7',
  }

  const y = doc.y
  doc
    .rect(60, y, 492, 50)
    .fillColor(bgColors[type])
    .fill()
    .rect(60, y, 4, 50)
    .fillColor(borderColors[type])
    .fill()
    .fillColor(colors.text)
    .fontSize(10)
    .text(text, 75, y + 15, { width: 462 })

  doc.y = y + 60
  doc.moveDown(0.5)
}

// ============================================
// PDF 1: Birth Preferences Worksheet
// ============================================
function generateBirthPreferences() {
  const doc = createPDF('birth-preferences-worksheet.pdf')
  let pageNum = 1

  addHeader(doc, 'Birth Preferences Worksheet')
  addTitle(
    doc,
    'Birth Preferences Worksheet',
    'Explore your options and communicate your wishes'
  )

  addCallout(
    doc,
    'TIP: This worksheet is meant to be a starting point for conversations with your provider and doula. Birth is unpredictable—stay flexible while honoring your priorities.',
    'tip'
  )

  addSection(doc, 'Environment & Atmosphere')
  addCheckbox(doc, 'Dim lighting')
  addCheckbox(doc, 'Music (I will bring my own playlist)')
  addCheckbox(doc, 'Aromatherapy (check hospital policy)')
  addCheckbox(doc, 'Minimal interruptions during labor')
  addCheckbox(doc, 'Limited number of people in the room')
  addCheckbox(doc, 'Freedom to move around')
  addCheckbox(doc, 'Access to shower/tub if available')

  addSection(doc, 'Pain Management Preferences')
  doc.text(
    'Circle your preference level: 1 = Prefer to avoid, 5 = Definitely want'
  )
  doc.moveDown(0.5)
  addCheckbox(doc, 'Epidural:  1  2  3  4  5')
  addCheckbox(doc, 'IV pain medication:  1  2  3  4  5')
  addCheckbox(doc, 'Nitrous oxide (if available):  1  2  3  4  5')
  addCheckbox(doc, 'Natural comfort measures only:  1  2  3  4  5')
  doc.moveDown(0.5)
  doc.fontSize(10).fillColor(colors.textMuted)
  doc.text(
    'Note: You can change your mind at any time during labor. These are preferences, not commitments.'
  )

  addSection(doc, 'Labor Interventions')
  addCheckbox(doc, 'I prefer to avoid induction unless medically necessary')
  addCheckbox(
    doc,
    'I would like to try natural methods first (walking, nipple stimulation)'
  )
  addCheckbox(doc, 'I prefer intermittent monitoring if possible')
  addCheckbox(
    doc,
    'I want to avoid artificial rupture of membranes unless necessary'
  )
  addCheckbox(doc, 'I prefer freedom to eat/drink light snacks during labor')

  addFooter(doc, pageNum)
  doc.addPage()
  pageNum++
  addHeader(doc)

  addSection(doc, 'Pushing & Delivery')
  addCheckbox(doc, 'I want to push in whatever position feels best')
  addCheckbox(doc, 'I prefer mother-directed pushing over coached counting')
  addCheckbox(doc, 'I want a mirror to see baby emerging')
  addCheckbox(doc, "Partner wants to announce baby's sex")
  addCheckbox(doc, 'Partner wants to cut the cord')
  addCheckbox(doc, 'I want delayed cord clamping (at least 1-3 minutes)')

  addSection(doc, 'Immediately After Birth')
  addCheckbox(doc, 'Immediate skin-to-skin contact')
  addCheckbox(doc, 'Delay all non-urgent procedures for first hour')
  addCheckbox(doc, 'Breastfeed within first hour')
  addCheckbox(doc, 'Partner skin-to-skin if I am unable')
  addCheckbox(doc, 'Keep baby in room at all times')

  addSection(doc, 'Newborn Procedures')
  addCheckbox(doc, 'Vitamin K injection: Yes / No / Discuss further')
  addCheckbox(doc, 'Eye ointment: Yes / No / Discuss further')
  addCheckbox(doc, 'Hepatitis B vaccine: Yes / No / Discuss further')
  addCheckbox(doc, 'Hearing screening: Yes / Delay / Discuss further')

  addSection(doc, 'If Cesarean Becomes Necessary')
  addCheckbox(doc, 'Partner present in OR')
  addCheckbox(doc, 'Lowered drape to see baby emerge')
  addCheckbox(doc, 'Skin-to-skin in OR if possible')
  addCheckbox(doc, 'Delayed cord clamping if safe')
  addCheckbox(doc, 'Partner to accompany baby if separation needed')

  addSection(doc, 'Questions for Your Provider')
  doc.fillColor(colors.text).fontSize(11)
  doc.text('Write down questions to discuss at your next appointment:')
  doc.moveDown(0.5)
  for (let i = 0; i < 6; i++) {
    doc
      .moveTo(60, doc.y)
      .lineTo(552, doc.y)
      .strokeColor(colors.primaryLight)
      .stroke()
    doc.moveDown(1.2)
  }

  addFooter(doc, pageNum)
  doc.addPage()
  pageNum++
  addHeader(doc)

  addSection(doc, 'Notes from Provider Discussion')
  doc.fillColor(colors.text).fontSize(11)
  doc.text('Date: _______________  Provider: _______________')
  doc.moveDown(1)
  for (let i = 0; i < 15; i++) {
    doc
      .moveTo(60, doc.y)
      .lineTo(552, doc.y)
      .strokeColor(colors.primaryLight)
      .stroke()
    doc.moveDown(1.2)
  }

  addCallout(
    doc,
    'Remember: Your doula can help you discuss these preferences with your provider and support you in advocating for your wishes during labor.',
    'info'
  )

  addFooter(doc, pageNum)
  doc.end()
  console.log('Generated: birth-preferences-worksheet.pdf')
}

// ============================================
// PDF 2: Hospital Bag Checklist
// ============================================
function generateHospitalBag() {
  const doc = createPDF('hospital-bag-checklist.pdf')
  let pageNum = 1

  addHeader(doc)
  addTitle(
    doc,
    'Hospital Bag Checklist',
    'Everything you need for labor, recovery, and coming home'
  )

  addCallout(
    doc,
    'TIP: Pack your bag around 36 weeks. Keep it by the door or in your car. Most hospitals provide basics like diapers, pads, and mesh underwear—check with yours!',
    'tip'
  )

  addSection(doc, 'For Labor')
  addCheckbox(doc, 'Insurance card & ID')
  addCheckbox(doc, 'Birth preferences (2-3 copies)')
  addCheckbox(doc, 'Phone charger (long cord!)')
  addCheckbox(doc, 'Comfortable robe or labor gown')
  addCheckbox(doc, 'Non-slip socks or slippers')
  addCheckbox(doc, 'Hair ties/headband')
  addCheckbox(doc, 'Lip balm (labor = dry lips)')
  addCheckbox(doc, 'Massage tools (tennis balls, etc.)')
  addCheckbox(doc, 'Focal point or photos')
  addCheckbox(doc, 'Speaker for music')
  addCheckbox(doc, 'Essential oils (check hospital policy)')
  addCheckbox(doc, 'Snacks for early labor')

  addSection(doc, 'For Recovery & Postpartum')
  addCheckbox(doc, 'Comfortable nightgown/pajamas (nursing-friendly)')
  addCheckbox(doc, 'Nursing bras (2-3)')
  addCheckbox(doc, 'Nipple cream')
  addCheckbox(doc, 'Breast pads')
  addCheckbox(doc, 'Your own toiletries')
  addCheckbox(doc, 'Comfortable underwear (or use hospital mesh)')
  addCheckbox(doc, 'Going-home outfit (loose & comfortable)')
  addCheckbox(doc, 'Pillow from home (distinctive pillowcase)')

  addFooter(doc, pageNum)
  doc.addPage()
  pageNum++
  addHeader(doc)

  addSection(doc, 'For Partner/Support Person')
  addCheckbox(doc, 'Change of clothes')
  addCheckbox(doc, 'Toiletries')
  addCheckbox(doc, 'Phone charger')
  addCheckbox(doc, 'Snacks & drinks')
  addCheckbox(doc, 'Cash for vending machines/cafeteria')
  addCheckbox(doc, 'Pillow/blanket')
  addCheckbox(doc, 'Entertainment (book, tablet)')
  addCheckbox(doc, 'Camera (if not using phone)')
  addCheckbox(doc, 'List of people to notify')

  addSection(doc, 'For Baby')
  addCheckbox(doc, 'Going-home outfit (+ backup in different size)')
  addCheckbox(doc, 'Swaddle blanket')
  addCheckbox(doc, 'Car seat (properly installed!)')
  addCheckbox(doc, 'Newborn diapers (hospital usually provides)')

  addCallout(
    doc,
    'CAR SEAT SAFETY: Make sure your car seat is properly installed before your due date. As a certified CPST, I offer car seat checks as part of my doula services or as a standalone service.',
    'warning'
  )

  addSection(doc, 'Nice to Have (But Not Essential)')
  addCheckbox(doc, 'Thank you gifts for nurses')
  addCheckbox(doc, 'Nursing pillow')
  addCheckbox(doc, 'White noise machine')
  addCheckbox(doc, 'Fancy going-home outfit for photos')
  addCheckbox(doc, 'Birth announcements')

  addSection(doc, 'Things to Leave at Home')
  addBullet(doc, 'Valuables or expensive jewelry')
  addBullet(doc, 'Too many outfit options')
  addBullet(doc, 'Heavy books or lots of entertainment (you will be busy!)')
  addBullet(doc, 'Breast pump (unless specifically advised)')

  addSection(doc, 'Last-Minute Items (Add Just Before Leaving)')
  addCheckbox(doc, 'Phone')
  addCheckbox(doc, 'Glasses/contacts')
  addCheckbox(doc, 'Current medications')
  addCheckbox(doc, 'Wallet')

  addFooter(doc, pageNum)
  doc.end()
  console.log('Generated: hospital-bag-checklist.pdf')
}

// ============================================
// PDF 3: Postpartum Preparation Guide
// ============================================
function generatePostpartumPrep() {
  const doc = createPDF('postpartum-prep-guide.pdf')
  let pageNum = 1

  addHeader(doc)
  addTitle(
    doc,
    'Postpartum Preparation Guide',
    'Setting yourself up for a supported fourth trimester'
  )

  doc.fillColor(colors.text).fontSize(11)
  doc.text(
    'The "fourth trimester" (first 12 weeks after birth) is a period of profound adjustment. Planning ahead can make this transition smoother for your whole family.',
    { align: 'center' }
  )
  doc.moveDown(1.5)

  addSection(doc, 'Prepare Your Home')
  addCheckbox(
    doc,
    'Create a nursing/feeding station (water, snacks, phone charger, burp cloths)'
  )
  addCheckbox(doc, 'Set up multiple diaper changing spots')
  addCheckbox(doc, 'Prep safe sleep space for baby')
  addCheckbox(
    doc,
    'Stock up on postpartum supplies (pads, peri bottle, stool softener)'
  )
  addCheckbox(doc, 'Organize baby clothes by size')
  addCheckbox(doc, 'Prepare freezer meals (aim for 2 weeks worth)')
  addCheckbox(doc, 'Deep clean or hire cleaning service')
  addCheckbox(
    doc,
    'Set up a "recovery basket" with essentials in each main room'
  )

  addSection(doc, 'Build Your Support System')
  addCheckbox(doc, 'Make a list of people who can help (and HOW they can help)')
  addCheckbox(doc, 'Set up a meal train')
  addCheckbox(
    doc,
    'Research and save phone numbers: pediatrician, lactation, postpartum support'
  )
  addCheckbox(doc, 'Discuss postpartum plan with partner')
  addCheckbox(doc, 'Consider a postpartum doula for extra support')
  addCheckbox(doc, 'Plan for older children and pets')

  addCallout(
    doc,
    'TIP: When people ask "How can I help?" be specific: "Can you bring dinner Tuesday?" "Can you hold baby while I shower?" "Can you run a load of laundry?"',
    'tip'
  )

  addFooter(doc, pageNum)
  doc.addPage()
  pageNum++
  addHeader(doc)

  addSection(doc, 'Physical Recovery')
  doc.fillColor(colors.text).fontSize(11)
  doc.text('Expect these normal postpartum experiences:')
  doc.moveDown(0.5)
  addBullet(doc, 'Vaginal bleeding (lochia) for 4-6 weeks')
  addBullet(doc, 'Cramping, especially while breastfeeding')
  addBullet(doc, 'Breast engorgement around day 3-5')
  addBullet(doc, 'Night sweats')
  addBullet(doc, 'Hair loss (usually starting around 3 months)')
  addBullet(doc, 'Constipation (drink water, eat fiber, take stool softener)')
  addBullet(doc, 'Exhaustion and overwhelm')

  addSection(doc, 'Self-Care Essentials')
  addCheckbox(doc, "Rest when baby rests (even if you can't sleep)")
  addCheckbox(doc, 'Eat regular, nourishing meals')
  addCheckbox(doc, 'Stay hydrated (especially if breastfeeding)')
  addCheckbox(doc, 'Limit visitors in the first 2 weeks')
  addCheckbox(doc, 'Accept help without guilt')
  addCheckbox(doc, 'Get outside for fresh air when ready')
  addCheckbox(doc, 'Be gentle with yourself')

  addSection(doc, 'Warning Signs - Call Your Provider If:')
  doc.fillColor(colors.danger)
  addBullet(doc, 'Heavy bleeding (soaking more than 1 pad per hour)')
  addBullet(doc, 'Fever over 100.4°F')
  addBullet(doc, "Severe headache that doesn't improve")
  addBullet(doc, 'Pain, swelling, or redness in legs')
  addBullet(doc, 'Chest pain or difficulty breathing')
  addBullet(doc, 'Thoughts of harming yourself or baby')
  addBullet(doc, "Feeling like you can't cope")

  addCallout(
    doc,
    "IMPORTANT: Postpartum depression and anxiety are common and treatable. If you're struggling, reach out to your provider. You deserve support.",
    'warning'
  )

  addFooter(doc, pageNum)
  doc.addPage()
  pageNum++
  addHeader(doc)

  addSection(doc, 'Emotional Wellness')
  doc.fillColor(colors.text).fontSize(11)
  doc.text(
    'The "baby blues" (mood swings, tearfulness) affect up to 80% of new parents and typically resolve within 2 weeks. Watch for signs of postpartum depression or anxiety:'
  )
  doc.moveDown(0.5)
  addBullet(doc, 'Persistent sadness or emptiness')
  addBullet(doc, 'Difficulty bonding with baby')
  addBullet(doc, 'Withdrawing from family and friends')
  addBullet(doc, 'Racing thoughts or excessive worry')
  addBullet(
    doc,
    'Changes in appetite or sleep (beyond normal newborn disruption)'
  )
  addBullet(doc, "Feeling like you're not a good parent")

  addSection(doc, 'Meal Prep Ideas')
  doc.fillColor(colors.text).fontSize(11)
  doc.text('Freezer-friendly meals to prepare ahead:')
  doc.moveDown(0.5)
  addBullet(doc, 'Soups and stews in freezer bags')
  addBullet(doc, 'Casseroles (lasagna, enchiladas)')
  addBullet(doc, 'Breakfast burritos')
  addBullet(doc, 'Muffins and lactation cookies')
  addBullet(doc, 'Pre-portioned smoothie ingredients')
  addBullet(doc, 'Marinated proteins ready to cook')
  doc.moveDown(0.5)
  doc.text(
    'Stock your pantry with easy snacks: nuts, granola bars, crackers, cheese, fruit.'
  )

  addSection(doc, 'Partner Planning Conversation Starters')
  addBullet(doc, 'How will we handle nighttime feeds/wake-ups?')
  addBullet(doc, 'What does household help look like from each of us?')
  addBullet(doc, "How will we communicate when we're stressed or overwhelmed?")
  addBullet(doc, 'What are our boundaries around visitors?')
  addBullet(doc, 'How will we each get some personal time to recharge?')

  addFooter(doc, pageNum)
  doc.end()
  console.log('Generated: postpartum-prep-guide.pdf')
}

// ============================================
// PDF 4: Car Seat Safety Quick Reference
// ============================================
function generateCarSeatSafety() {
  const doc = createPDF('car-seat-quick-reference.pdf')
  let pageNum = 1

  addHeader(doc)
  addTitle(
    doc,
    'Car Seat Safety Quick Reference',
    'From a Certified Child Passenger Safety Technician'
  )

  addCallout(
    doc,
    "73% of car seats are installed incorrectly. Even the safest car seat won't protect your child if it's not installed and used correctly. Use this guide—but consider getting a professional car seat check!",
    'warning'
  )

  addSection(doc, 'Installation Check')
  doc.fillColor(colors.text).fontSize(11)
  doc.text('Test your installation with these checks:')
  doc.moveDown(0.5)
  addCheckbox(
    doc,
    'The seat moves less than 1 inch side-to-side at the belt path'
  )
  addCheckbox(
    doc,
    'The seat moves less than 1 inch front-to-back at the belt path'
  )
  addCheckbox(
    doc,
    'Using EITHER LATCH or seatbelt (not both, unless manual says otherwise)'
  )
  addCheckbox(
    doc,
    'Rear-facing: Recline angle is correct (check indicator on seat)'
  )
  addCheckbox(
    doc,
    'Seatbelt is locked (check your vehicle manual for locking method)'
  )

  addSection(doc, 'Harness Check')
  addCheckbox(doc, 'Harness straps lie flat (no twists)')
  addCheckbox(doc, 'Rear-facing: Straps at or BELOW shoulders')
  addCheckbox(doc, 'Forward-facing: Straps at or ABOVE shoulders')
  addCheckbox(doc, 'Chest clip at armpit level (not on belly or neck)')
  addCheckbox(doc, 'Pinch test: Cannot pinch any slack at the shoulder')

  addSection(doc, 'The Pinch Test')
  doc.fillColor(colors.text).fontSize(11)
  doc.text(
    "After tightening the harness, try to pinch the strap at your child's shoulder:"
  )
  doc.moveDown(0.5)
  addBullet(doc, 'If you CAN pinch a fold of webbing = too loose')
  addBullet(doc, 'If you CANNOT pinch any webbing = correct')

  addFooter(doc, pageNum)
  doc.addPage()
  pageNum++
  addHeader(doc)

  addSection(doc, 'Common Mistakes to Avoid')
  addBullet(
    doc,
    'Turning forward-facing too early (keep rear-facing as long as possible)'
  )
  addBullet(doc, 'Loose harness (remember the pinch test)')
  addBullet(doc, 'Chest clip too low (should be at armpit level)')
  addBullet(
    doc,
    'Bulky winter coats under harness (put coat on backward OVER harness)'
  )
  addBullet(doc, 'Aftermarket accessories (only use what came with the seat)')
  addBullet(doc, 'Using an expired or crashed car seat')

  addSection(doc, 'Winter Safety')
  doc.fillColor(colors.text).fontSize(11)
  doc.text('Puffy coats compress in a crash, creating slack in the harness.')
  doc.moveDown(0.5)
  doc.font('Helvetica-Bold').text('Safe alternative:')
  doc.font('Helvetica')
  addBullet(doc, 'Strap baby in WITHOUT the coat', 1)
  addBullet(doc, 'Put a blanket over the harness', 1)
  addBullet(doc, 'OR turn the coat backward and put over buckled child', 1)

  addSection(doc, 'When to Schedule a Car Seat Check')
  addCheckbox(doc, 'Before baby is born (around 36 weeks)')
  addCheckbox(doc, 'When you get a new car seat')
  addCheckbox(doc, 'When transitioning to a different type of seat')
  addCheckbox(doc, 'After a car accident (any severity)')
  addCheckbox(doc, 'When moving the seat to a different vehicle')
  addCheckbox(doc, 'If anything ever feels "off"')

  addSection(doc, 'Car Seat Stages')
  doc.fillColor(colors.text).fontSize(11)
  doc.font('Helvetica-Bold').text('Rear-Facing (Infant & Convertible)')
  doc
    .font('Helvetica')
    .text(
      '• Birth until at least age 2, or until reaching max height/weight for rear-facing'
    )
  doc.text('• Best protection for head, neck, and spine')
  doc.moveDown(0.5)
  doc.font('Helvetica-Bold').text('Forward-Facing (with harness)')
  doc
    .font('Helvetica')
    .text(
      '• After outgrowing rear-facing limits, until reaching max height/weight for harness'
    )
  doc.text('• Keep in harness as long as possible')
  doc.moveDown(0.5)
  doc.font('Helvetica-Bold').text('Booster Seat')
  doc
    .font('Helvetica')
    .text(
      '• After outgrowing forward-facing harness, until seatbelt fits properly'
    )
  doc.text('• Usually 8-12 years old and 4\'9" tall')

  addCallout(
    doc,
    "As a certified CPST, I offer free car seat checks for my doula clients and affordable standalone checks for all families. Don't guess—get it checked!",
    'info'
  )

  addFooter(doc, pageNum)
  doc.end()
  console.log('Generated: car-seat-quick-reference.pdf')
}

// ============================================
// PDF 5: Newborn Care Basics
// ============================================
function generateNewbornCare() {
  const doc = createPDF('newborn-care-basics.pdf')
  let pageNum = 1

  addHeader(doc)
  addTitle(
    doc,
    'Newborn Care Basics',
    'Essential information for the first weeks at home'
  )

  addSection(doc, 'Feeding Your Newborn')
  doc.fillColor(colors.text).fontSize(11)
  doc.text(
    'In the first weeks, expect to feed every 2-3 hours (or more often!)'
  )
  doc.moveDown(0.5)
  doc.font('Helvetica-Bold').text('Hunger Cues (from early to late):')
  doc.font('Helvetica')
  addBullet(doc, 'Early: Stirring, opening mouth, turning head (rooting)', 1)
  addBullet(doc, 'Active: Stretching, increasing movement, hand to mouth', 1)
  addBullet(
    doc,
    'Late: Crying, fussing, agitated (try to feed before this!)',
    1
  )

  doc.moveDown(0.5)
  doc.font('Helvetica-Bold').text('Is Baby Getting Enough?')
  doc.font('Helvetica')
  addBullet(doc, '6+ wet diapers per day (after day 4)')
  addBullet(doc, '3-4+ bowel movements per day (may decrease after 6 weeks)')
  addBullet(doc, 'Baby seems satisfied after feeding')
  addBullet(doc, 'Steady weight gain (after initial loss)')

  addSection(doc, 'Safe Sleep (ABCs)')
  doc.fillColor(colors.text).fontSize(11)
  doc.font('Helvetica-Bold').text('A - Alone')
  doc
    .font('Helvetica')
    .text('Baby sleeps in their own space (no blankets, pillows, toys)')
  doc.moveDown(0.3)
  doc.font('Helvetica-Bold').text('B - Back')
  doc.font('Helvetica').text('Always place baby on their BACK to sleep')
  doc.moveDown(0.3)
  doc.font('Helvetica-Bold').text('C - Crib')
  doc.font('Helvetica').text('Firm, flat surface (crib, bassinet, play yard)')
  doc.moveDown(0.5)

  addCallout(
    doc,
    'Room-sharing (baby in your room in their own sleep space) is recommended for the first 6-12 months. This is different from bed-sharing.',
    'tip'
  )

  addFooter(doc, pageNum)
  doc.addPage()
  pageNum++
  addHeader(doc)

  addSection(doc, 'Diaper Basics')
  doc.fillColor(colors.text).fontSize(11)
  doc.font('Helvetica-Bold').text('What to Expect:')
  doc.font('Helvetica')
  addBullet(doc, 'Day 1-2: Dark, sticky meconium (tar-like)')
  addBullet(doc, 'Day 3-4: Transitional greenish-brown')
  addBullet(doc, 'Day 5+: Yellow, seedy (breastfed) or tan/yellow (formula)')

  doc.moveDown(0.5)
  doc.font('Helvetica-Bold').text('Diaper Change Tips:')
  doc.font('Helvetica')
  addBullet(doc, 'Clean front to back (especially for girls)')
  addBullet(doc, 'Point penis down in diaper (for boys)')
  addBullet(doc, 'Pat dry, apply diaper cream if needed')
  addBullet(doc, 'Fold diaper down under umbilical cord stump')

  addSection(doc, 'Umbilical Cord Care')
  addBullet(doc, 'Keep the stump clean and DRY')
  addBullet(doc, 'Fold diaper below the stump')
  addBullet(doc, 'Sponge baths only until it falls off (usually 1-3 weeks)')
  addBullet(doc, "Don't pull on it—let it fall off naturally")
  addBullet(doc, 'A little blood when it falls off is normal')

  addSection(doc, 'When to Call Your Pediatrician')
  doc.fillColor(colors.danger)
  addBullet(doc, 'Fever over 100.4°F (rectal) in baby under 3 months')
  addBullet(doc, 'Refusing to eat or eating much less than usual')
  addBullet(doc, 'Difficulty breathing or very rapid breathing')
  addBullet(doc, 'Yellow skin or eyes (jaundice) that worsens')
  addBullet(doc, 'Fewer than 6 wet diapers in 24 hours (after day 4)')
  addBullet(doc, 'Blood in stool')
  addBullet(doc, 'Extreme fussiness or limpness/lethargy')
  addBullet(doc, 'Redness, swelling, or pus at umbilical stump')

  addFooter(doc, pageNum)
  doc.addPage()
  pageNum++
  addHeader(doc)

  addSection(doc, 'Soothing Your Newborn')
  doc.fillColor(colors.text).fontSize(11)
  doc.text('The "5 S\'s" for soothing a fussy baby:')
  doc.moveDown(0.5)
  addBullet(doc, 'Swaddling: Snug wrap for security')
  addBullet(
    doc,
    'Side/Stomach position: Hold baby on side/stomach (back for sleep)'
  )
  addBullet(doc, 'Shushing: White noise or "shhhh" sounds')
  addBullet(doc, 'Swinging: Gentle rhythmic motion')
  addBullet(doc, 'Sucking: Breast, finger, or pacifier')

  addSection(doc, 'Newborn Sleep Patterns')
  addBullet(doc, 'Newborns sleep 14-17 hours total, in short stretches')
  addBullet(doc, 'Expect to wake every 2-3 hours for feeding')
  addBullet(
    doc,
    'Day/night confusion is normal—keep days bright and active, nights dark and calm'
  )
  addBullet(doc, 'Longer stretches usually develop around 3-4 months')

  addSection(doc, 'Normal Newborn Things That May Surprise You')
  addBullet(doc, 'Sneezing frequently (clearing nasal passages)')
  addBullet(doc, 'Hiccups after feeding')
  addBullet(doc, 'Loud breathing/grunting')
  addBullet(doc, 'Startle reflex (arms flailing)')
  addBullet(doc, 'Crossed eyes (eye muscles are developing)')
  addBullet(doc, 'Baby acne and peeling skin')
  addBullet(doc, 'Sleeping with eyes partially open')

  addCallout(
    doc,
    "As a postpartum doula, I help families navigate these early weeks with hands-on support and education. You don't have to figure it all out alone!",
    'info'
  )

  addFooter(doc, pageNum)
  doc.end()
  console.log('Generated: newborn-care-basics.pdf')
}

// ============================================
// PDF 6: Breastfeeding Quick Start Guide
// ============================================
function generateBreastfeedingGuide() {
  const doc = createPDF('breastfeeding-quick-start.pdf')
  let pageNum = 1

  addHeader(doc)
  addTitle(
    doc,
    'Breastfeeding Quick Start Guide',
    'Getting off to a good start with feeding your baby'
  )

  addSection(doc, 'The First Hour')
  doc.fillColor(colors.text).fontSize(11)
  doc.text('Skin-to-skin contact immediately after birth helps:')
  addBullet(doc, "Regulate baby's temperature and heart rate", 1)
  addBullet(doc, 'Stimulate breastfeeding instincts', 1)
  addBullet(doc, 'Calm both you and baby', 1)
  doc.moveDown(0.5)
  doc.text(
    'Babies are often alert and ready to feed in the first hour—this is a great time for the first latch!'
  )

  addSection(doc, 'Signs of a Good Latch')
  addCheckbox(doc, "Baby's mouth is open wide (like a yawn)")
  addCheckbox(doc, 'Lips flanged outward (like fish lips)')
  addCheckbox(doc, 'Chin touching breast, nose free or just barely touching')
  addCheckbox(doc, 'You can see/hear swallowing')
  addCheckbox(doc, 'Comfortable after initial latch (slight pinch is normal)')

  addSection(doc, 'Common Early Challenges')
  doc.fillColor(colors.text).fontSize(11)
  doc.font('Helvetica-Bold').text('Nipple Soreness')
  doc.font('Helvetica')
  doc.text(
    'Some tenderness is normal in the first week. If pain continues throughout feeding or nipples are cracked/bleeding, get help with latch.'
  )
  doc.moveDown(0.5)
  doc.font('Helvetica-Bold').text('Engorgement')
  doc.font('Helvetica')
  doc.text(
    'Breasts become very full around days 3-5. Frequent feeding, warm compresses before feeding, and cold compresses after can help.'
  )
  doc.moveDown(0.5)
  doc.font('Helvetica-Bold').text('Cluster Feeding')
  doc.font('Helvetica')
  doc.text(
    'Baby wants to feed constantly, especially in evenings. This is normal and helps establish your supply!'
  )

  addFooter(doc, pageNum)
  doc.addPage()
  pageNum++
  addHeader(doc)

  addSection(doc, 'Is Baby Getting Enough?')
  doc.fillColor(colors.text).fontSize(11)
  doc.font('Helvetica-Bold').text('Output Signs:')
  doc.font('Helvetica')
  addBullet(doc, 'Day 1: 1-2 wet diapers, 1-2 dark stools')
  addBullet(doc, 'Day 2: 2-3 wet diapers, 1-2 dark stools')
  addBullet(doc, 'Day 3: 3-4 wet diapers, stools transitioning')
  addBullet(doc, 'Day 4+: 6+ wet diapers, 3-4+ yellow, seedy stools')

  doc.moveDown(0.5)
  doc.font('Helvetica-Bold').text('Feeding Behavior:')
  doc.font('Helvetica')
  addBullet(doc, 'Baby seems satisfied after feeding')
  addBullet(doc, 'Active sucking with swallowing')
  addBullet(doc, 'Waking on own to feed (not always sleeping)')
  addBullet(doc, 'Gaining weight (after initial loss of up to 7-10%)')

  addSection(doc, 'When to Seek Help')
  doc.fillColor(colors.danger)
  addBullet(doc, "Baby isn't latching or won't stay latched")
  addBullet(doc, "Painful breastfeeding that doesn't improve")
  addBullet(doc, 'Cracked or bleeding nipples')
  addBullet(doc, 'Baby not making enough wet/dirty diapers')
  addBullet(doc, 'Baby losing more than 10% birth weight')
  addBullet(doc, 'Baby still jaundiced after 2 weeks')
  addBullet(doc, 'Signs of mastitis (fever, red/hot area on breast)')

  addCallout(
    doc,
    "Early intervention makes a big difference! If you're struggling, don't wait—contact a lactation consultant. As a certified lactation counselor, I can help with many common issues.",
    'warning'
  )

  addSection(doc, 'Helpful Positions')
  doc.fillColor(colors.text).fontSize(11)
  doc.font('Helvetica-Bold').text('Cradle Hold')
  doc
    .font('Helvetica')
    .text('Classic position with baby across your lap, head in crook of arm')
  doc.moveDown(0.3)
  doc.font('Helvetica-Bold').text('Cross-Cradle')
  doc
    .font('Helvetica')
    .text("Opposite hand supports baby's head—great for getting a good latch")
  doc.moveDown(0.3)
  doc.font('Helvetica-Bold').text('Football/Clutch')
  doc
    .font('Helvetica')
    .text('Baby tucked at your side—good for c-section recovery')
  doc.moveDown(0.3)
  doc.font('Helvetica-Bold').text('Side-Lying')
  doc
    .font('Helvetica')
    .text('Both you and baby lying down—great for night feeds')

  addFooter(doc, pageNum)
  doc.end()
  console.log('Generated: breastfeeding-quick-start.pdf')
}

// ============================================
// PDF 7: Partner Support Guide
// ============================================
function generatePartnerGuide() {
  const doc = createPDF('partner-support-guide.pdf')
  let pageNum = 1

  addHeader(doc)
  addTitle(
    doc,
    'Partner Support Guide',
    'How to be an amazing support throughout pregnancy, birth, and beyond'
  )

  doc.fillColor(colors.text).fontSize(11)
  doc.text(
    "Being a supportive partner doesn't mean having all the answers. It means being present, learning alongside, and showing up consistently. Here's how.",
    { align: 'center' }
  )
  doc.moveDown(1.5)

  addSection(doc, 'During Pregnancy')
  doc.font('Helvetica-Bold').text('Ways to Show Support:')
  doc.font('Helvetica')
  addBullet(doc, 'Attend prenatal appointments (or ask for updates after)')
  addBullet(doc, 'Read one book or resource about pregnancy/birth')
  addBullet(doc, "Learn about your partner's birth preferences")
  addBullet(doc, 'Take on extra household tasks as pregnancy progresses')
  addBullet(doc, 'Plan date nights before baby arrives')
  addBullet(doc, 'Be patient with mood changes and physical discomfort')
  addBullet(doc, 'Attend childbirth education class together')

  addSection(doc, 'During Labor')
  doc.font('Helvetica-Bold').text('Active Support Techniques:')
  doc.font('Helvetica')
  addBullet(doc, 'Offer water/ice chips frequently')
  addBullet(doc, 'Apply counter-pressure on back during contractions')
  addBullet(doc, 'Encourage position changes every 30-60 minutes')
  addBullet(doc, 'Use encouraging words: "You\'re doing amazing"')
  addBullet(doc, 'Protect the space (dim lights, minimize interruptions)')
  addBullet(doc, 'Time contractions when helpful')
  addBullet(doc, 'Remind them to empty bladder every hour')
  addBullet(doc, 'Hold hands, make eye contact, breathe together')

  addCallout(
    doc,
    'TIP: Your partner doesn\'t need you to "fix" anything. Being calm, present, and encouraging is often the most valuable support you can offer.',
    'tip'
  )

  addFooter(doc, pageNum)
  doc.addPage()
  pageNum++
  addHeader(doc)

  addSection(doc, 'What to Say (and Not Say)')
  doc.fillColor(colors.success).fontSize(11)
  doc.font('Helvetica-Bold').text('✓ Helpful Things to Say:')
  doc.font('Helvetica').fillColor(colors.text)
  addBullet(doc, '"You\'re so strong"', 1)
  addBullet(doc, '"One contraction at a time"', 1)
  addBullet(doc, '"I\'m right here"', 1)
  addBullet(doc, '"What do you need?"', 1)
  addBullet(doc, '"I love you"', 1)
  addBullet(doc, '"I\'m so proud of you"', 1)

  doc.moveDown(0.5)
  doc.fillColor(colors.danger)
  doc.font('Helvetica-Bold').text('✗ Things to Avoid:')
  doc.font('Helvetica').fillColor(colors.text)
  addBullet(doc, '"Calm down" or "Relax"', 1)
  addBullet(doc, '"It can\'t be that bad"', 1)
  addBullet(doc, '"When will this be over?"', 1)
  addBullet(doc, '"My mom said..."', 1)
  addBullet(doc, 'Complaints about your discomfort', 1)

  addSection(doc, 'During Postpartum')
  doc.font('Helvetica-Bold').text('Practical Ways to Help:')
  doc.font('Helvetica').fillColor(colors.text)
  addBullet(doc, 'Take over diaper changes')
  addBullet(doc, 'Handle night feedings you can (bottle if applicable)')
  addBullet(doc, 'Prepare meals and snacks')
  addBullet(doc, 'Do laundry and housework')
  addBullet(doc, 'Be the gatekeeper for visitors')
  addBullet(doc, 'Encourage rest ("I\'ve got this—go sleep")')
  addBullet(doc, 'Run errands')
  addBullet(doc, 'Learn to soothe baby your own way')

  doc.moveDown(0.5)
  doc.font('Helvetica-Bold').text('Emotional Support:')
  doc.font('Helvetica')
  addBullet(doc, 'Check in daily: "How are you feeling?"')
  addBullet(doc, 'Listen without trying to solve')
  addBullet(doc, 'Validate the difficulty of recovery and feeding')
  addBullet(doc, 'Watch for signs of postpartum depression')
  addBullet(doc, 'Express appreciation and admiration')
  addBullet(doc, 'Take initiative without being asked')

  addFooter(doc, pageNum)
  doc.addPage()
  pageNum++
  addHeader(doc)

  addSection(doc, 'Taking Care of Yourself')
  doc.fillColor(colors.text).fontSize(11)
  doc.text("You can't pour from an empty cup. Partners need support too.")
  doc.moveDown(0.5)
  addBullet(doc, 'Eat regular meals')
  addBullet(doc, 'Get outside for fresh air')
  addBullet(doc, 'Accept help from family and friends')
  addBullet(doc, 'Connect with other new parents')
  addBullet(doc, 'Give yourself grace—this is new for you too')
  addBullet(doc, 'Talk about your feelings')

  addCallout(
    doc,
    "Partner postpartum depression is real. If you're feeling disconnected, anxious, irritable, or not yourself for more than 2 weeks, talk to someone.",
    'warning'
  )

  addSection(doc, 'Working with a Doula')
  doc.fillColor(colors.text).fontSize(11)
  doc.text("A doula doesn't replace you—they enhance your support!")
  doc.moveDown(0.5)
  addBullet(doc, "Doulas suggest techniques when you're out of ideas")
  addBullet(doc, 'They can give you breaks when needed')
  addBullet(doc, "They help you understand what's happening")
  addBullet(doc, 'You stay the primary support person')
  addBullet(
    doc,
    'Research shows partners feel MORE involved with a doula present'
  )

  addSection(doc, 'Questions to Discuss with Your Partner')
  addBullet(doc, 'What does "support" look like to you during labor?')
  addBullet(doc, 'How do you want me to handle pain management decisions?')
  addBullet(doc, 'What are our plans for visitors after birth?')
  addBullet(doc, 'How will we divide nighttime responsibilities?')
  addBullet(doc, 'What support do you want me to give vs. seek from others?')

  addFooter(doc, pageNum)
  doc.end()
  console.log('Generated: partner-support-guide.pdf')
}

// ============================================
// PDF 8: Questions for Your Provider
// ============================================
function generateProviderQuestions() {
  const doc = createPDF('provider-questions.pdf')
  let pageNum = 1

  addHeader(doc)
  addTitle(
    doc,
    'Questions for Your Provider',
    'Evidence-based questions to discuss at your prenatal appointments'
  )

  addCallout(
    doc,
    'TIP: Bring this sheet to appointments. Circle questions that matter most to you and take notes. Remember: there are no "stupid" questions!',
    'tip'
  )

  addSection(doc, 'First Trimester Questions')
  addCheckbox(doc, 'What prenatal testing do you recommend and why?')
  addCheckbox(doc, 'What symptoms should prompt me to call your office?')
  addCheckbox(doc, 'What activities/foods should I avoid or limit?')
  addCheckbox(doc, 'What prenatal vitamin do you recommend?')
  addCheckbox(doc, 'Who will I see for appointments throughout pregnancy?')
  addCheckbox(doc, "What is your practice's approach to weight gain?")
  doc.fillColor(colors.textMuted).fontSize(9)
  doc.text('Notes: ________________________________________________________')
  doc.text('_____________________________________________________________')

  addSection(doc, 'Second Trimester Questions')
  addCheckbox(doc, 'Do you recommend the anatomy scan? What does it check for?')
  addCheckbox(doc, 'What is your approach to gestational diabetes screening?')
  addCheckbox(doc, 'At what point do you recommend childbirth education?')
  addCheckbox(doc, 'What are your policies around doula support during labor?')
  addCheckbox(
    doc,
    'Will I be able to meet all providers who might attend my birth?'
  )
  addCheckbox(doc, 'What is your c-section rate? Episiotomy rate?')
  doc.fillColor(colors.textMuted).fontSize(9)
  doc.text('Notes: ________________________________________________________')
  doc.text('_____________________________________________________________')

  addFooter(doc, pageNum)
  doc.addPage()
  pageNum++
  addHeader(doc)

  addSection(doc, 'Third Trimester Questions')
  addCheckbox(doc, 'What is your approach to induction? At what week?')
  addCheckbox(doc, 'What happens if I go past my due date?')
  addCheckbox(doc, 'What are your policies on eating/drinking during labor?')
  addCheckbox(doc, 'How do you feel about birth plans/preferences?')
  addCheckbox(doc, 'What pain management options are available?')
  addCheckbox(doc, 'What is your approach to fetal monitoring?')
  addCheckbox(doc, 'What are your policies on delayed cord clamping?')
  addCheckbox(doc, 'When should I go to the hospital/birth center?')
  doc.fillColor(colors.textMuted).fontSize(9)
  doc.text('Notes: ________________________________________________________')
  doc.text('_____________________________________________________________')

  addSection(doc, 'Questions About Interventions')
  addCheckbox(doc, 'Under what circumstances would you recommend induction?')
  addCheckbox(doc, 'What is your approach to augmenting labor (Pitocin)?')
  addCheckbox(doc, 'When do you recommend breaking water artificially?')
  addCheckbox(doc, 'What positions can I use during pushing?')
  addCheckbox(doc, 'What are your criteria for recommending a cesarean?')
  addCheckbox(
    doc,
    'If a c-section is needed, can I have skin-to-skin in the OR?'
  )
  doc.fillColor(colors.textMuted).fontSize(9)
  doc.text('Notes: ________________________________________________________')
  doc.text('_____________________________________________________________')

  addFooter(doc, pageNum)
  doc.addPage()
  pageNum++
  addHeader(doc)

  addSection(doc, 'Postpartum Questions')
  addCheckbox(
    doc,
    'How long will I stay in the hospital after vaginal birth? C-section?'
  )
  addCheckbox(
    doc,
    'What support is available for breastfeeding in the hospital?'
  )
  addCheckbox(doc, 'When is my postpartum follow-up appointment?')
  addCheckbox(doc, 'Who should I call with questions after discharge?')
  addCheckbox(doc, 'What warning signs should I watch for after birth?')
  addCheckbox(doc, 'Do you screen for postpartum depression?')
  doc.fillColor(colors.textMuted).fontSize(9)
  doc.text('Notes: ________________________________________________________')
  doc.text('_____________________________________________________________')

  addSection(doc, 'Questions for Pediatrician (Before Baby Arrives)')
  addCheckbox(doc, 'Are you accepting new patients?')
  addCheckbox(doc, 'Will you visit baby in the hospital?')
  addCheckbox(doc, 'What is your approach to breastfeeding support?')
  addCheckbox(doc, 'What is your vaccination schedule/philosophy?')
  addCheckbox(doc, 'How do you handle after-hours questions?')
  addCheckbox(doc, 'What hospital are you affiliated with?')
  doc.fillColor(colors.textMuted).fontSize(9)
  doc.text('Notes: ________________________________________________________')
  doc.text('_____________________________________________________________')

  addSection(doc, 'The "BRAIN" Framework for Decisions')
  doc.fillColor(colors.text).fontSize(11)
  doc.text('When facing any decision during pregnancy or birth, ask:')
  doc.moveDown(0.5)
  addBullet(doc, 'B - Benefits: What are the benefits of this option?')
  addBullet(doc, 'R - Risks: What are the risks or potential downsides?')
  addBullet(doc, 'A - Alternatives: What other options do we have?')
  addBullet(doc, 'I - Intuition: What does my gut tell me?')
  addBullet(doc, 'N - Nothing: What if we wait or do nothing right now?')

  addFooter(doc, pageNum)
  doc.end()
  console.log('Generated: provider-questions.pdf')
}

// ============================================
// PDF 9: Postpartum Recovery Checklist
// ============================================
function generatePostpartumRecovery() {
  const doc = createPDF('postpartum-recovery-checklist.pdf')
  let pageNum = 1

  addHeader(doc)
  addTitle(
    doc,
    'Postpartum Recovery Checklist',
    'Track your physical and emotional recovery day by day'
  )

  addSection(doc, 'Week 1: The First Days')
  doc.fillColor(colors.text).fontSize(11)
  doc.text('Focus: Rest, feed baby, bond, accept help')
  doc.moveDown(0.5)
  addCheckbox(doc, 'Established feeding routine (breast or bottle)')
  addCheckbox(doc, 'Baby has been seen by pediatrician')
  addCheckbox(doc, 'Pain is manageable with prescribed medications')
  addCheckbox(doc, 'Bleeding is gradually decreasing')
  addCheckbox(doc, 'Having bowel movements (may need stool softener)')
  addCheckbox(doc, 'Eating and drinking regularly')
  addCheckbox(doc, 'Getting some sleep between feedings')
  addCheckbox(doc, 'Have support system in place')

  addSection(doc, 'Week 2: Finding Your Rhythm')
  doc.fillColor(colors.text).fontSize(11)
  doc.text('Focus: Continue resting, start moving gently')
  doc.moveDown(0.5)
  addCheckbox(doc, 'Umbilical cord stump has fallen off (or is close)')
  addCheckbox(doc, "Starting to understand baby's cues")
  addCheckbox(doc, 'Taking short walks if comfortable')
  addCheckbox(doc, 'Connecting with other new parents')
  addCheckbox(doc, 'Baby has regained birth weight')
  addCheckbox(doc, 'Mood feels more stable (baby blues often peak day 4-5)')

  addCallout(
    doc,
    'Baby blues should resolve by 2 weeks. If sadness, anxiety, or difficulty coping persists, contact your provider about postpartum depression screening.',
    'warning'
  )

  addFooter(doc, pageNum)
  doc.addPage()
  pageNum++
  addHeader(doc)

  addSection(doc, 'Weeks 3-4: Gradual Progress')
  doc.fillColor(colors.text).fontSize(11)
  doc.text('Focus: Gentle activity, self-care, adjusting to "new normal"')
  doc.moveDown(0.5)
  addCheckbox(doc, 'Incision healing well (if c-section)')
  addCheckbox(doc, 'Perineal soreness improving (if vaginal delivery)')
  addCheckbox(doc, 'Able to do light household tasks')
  addCheckbox(doc, 'Getting outside daily')
  addCheckbox(doc, 'Feeding is becoming easier')
  addCheckbox(doc, 'Partner and I are communicating about needs')

  addSection(doc, 'Weeks 5-6: Postpartum Check-Up')
  doc.fillColor(colors.text).fontSize(11)
  doc.text('Focus: Provider visit, discuss ongoing needs')
  doc.moveDown(0.5)
  addCheckbox(doc, 'Attended 6-week postpartum appointment')
  addCheckbox(doc, 'Discussed birth control options')
  addCheckbox(doc, 'Completed postpartum depression screening')
  addCheckbox(doc, 'Cleared for exercise (if desired)')
  addCheckbox(doc, 'Discussed pelvic floor concerns')
  addCheckbox(doc, 'Addressed any ongoing physical concerns')

  addSection(doc, 'Questions for Your 6-Week Appointment')
  addCheckbox(doc, 'Is my healing progressing normally?')
  addCheckbox(doc, 'When can I resume exercise? What should I start with?')
  addCheckbox(doc, 'When can we resume intercourse? What should I expect?')
  addCheckbox(doc, 'What birth control options do you recommend?')
  addCheckbox(doc, 'Should I see a pelvic floor therapist?')
  addCheckbox(doc, 'How am I doing emotionally?')

  addFooter(doc, pageNum)
  doc.addPage()
  pageNum++
  addHeader(doc)

  addSection(doc, 'Daily Self-Care Checklist')
  doc.fillColor(colors.text).fontSize(11)
  doc.text('Small acts that make a big difference:')
  doc.moveDown(0.5)
  addCheckbox(doc, 'Drank at least 8 glasses of water')
  addCheckbox(doc, 'Ate 3 meals (even small ones)')
  addCheckbox(doc, 'Took medications/vitamins')
  addCheckbox(doc, 'Rested when baby rested (or at least sat down!)')
  addCheckbox(doc, 'Got some fresh air')
  addCheckbox(doc, 'Talked to another adult')
  addCheckbox(doc, 'Did something just for me (even 5 minutes)')
  addCheckbox(doc, 'Accepted help without guilt')

  addSection(doc, 'Warning Signs - Call Provider Immediately')
  doc.fillColor(colors.danger).fontSize(11)
  addBullet(doc, 'Fever over 100.4°F')
  addBullet(doc, 'Heavy bleeding (soaking more than 1 pad/hour)')
  addBullet(doc, 'Foul-smelling discharge')
  addBullet(doc, 'Pain, redness, or discharge at incision site')
  addBullet(doc, "Severe headache that doesn't improve")
  addBullet(doc, 'Vision changes')
  addBullet(doc, 'Chest pain or difficulty breathing')
  addBullet(doc, 'Calf pain, redness, or swelling')
  addBullet(doc, 'Thoughts of harming yourself or baby')

  addCallout(
    doc,
    "Trust your instincts. If something feels wrong, call your provider. It's always better to check than to wait.",
    'info'
  )

  addSection(doc, 'Emotional Wellness Check-In')
  doc.fillColor(colors.text).fontSize(11)
  doc.text("Rate how you're feeling (1 = rarely, 5 = often):")
  doc.moveDown(0.5)
  addCheckbox(doc, 'I feel bonded with my baby: 1 2 3 4 5')
  addCheckbox(doc, 'I feel hopeful about the future: 1 2 3 4 5')
  addCheckbox(doc, 'I feel supported: 1 2 3 4 5')
  addCheckbox(doc, 'I am able to rest: 1 2 3 4 5')
  addCheckbox(doc, 'I feel like myself: 1 2 3 4 5')

  addFooter(doc, pageNum)
  doc.end()
  console.log('Generated: postpartum-recovery-checklist.pdf')
}

// ============================================
// PDF 10: Central Nebraska Resources Directory
// ============================================
function generateLocalResources() {
  const doc = createPDF('central-nebraska-resources.pdf')
  let pageNum = 1

  addHeader(doc)
  addTitle(
    doc,
    'Central Nebraska Resources Directory',
    'Local support for families in Kearney, Grand Island, Hastings & surrounding areas'
  )

  addCallout(
    doc,
    'This directory is provided as a starting point. Always verify current information, insurance acceptance, and availability. Updated: December 2025',
    'tip'
  )

  addSection(doc, 'Hospitals with Labor & Delivery')
  doc.fillColor(colors.text).fontSize(11)
  doc.font('Helvetica-Bold').text('CHI Health Good Samaritan - Kearney')
  doc.font('Helvetica')
  doc.text('10 E 31st Street, Kearney, NE 68847')
  doc.text('(308) 865-7100')
  doc.moveDown(0.5)

  doc.font('Helvetica-Bold').text('CHI Health St. Francis - Grand Island')
  doc.font('Helvetica')
  doc.text('2620 W Faidley Ave, Grand Island, NE 68803')
  doc.text('(308) 398-5400')
  doc.moveDown(0.5)

  doc.font('Helvetica-Bold').text('Mary Lanning Healthcare - Hastings')
  doc.font('Helvetica')
  doc.text('715 N St Joseph Ave, Hastings, NE 68901')
  doc.text('(402) 463-4521')

  addSection(doc, 'Lactation Support')
  doc.fillColor(colors.text).fontSize(11)
  doc.font('Helvetica-Bold').text('Hospital Lactation Consultants')
  doc.font('Helvetica')
  doc.text(
    'All area hospitals have IBCLCs on staff. Ask your nurse for a referral during your stay.'
  )
  doc.moveDown(0.5)

  doc.font('Helvetica-Bold').text('WIC Breastfeeding Support')
  doc.font('Helvetica')
  doc.text('Free breastfeeding support for WIC participants')
  doc.text('Buffalo County: (308) 865-5560')
  doc.text('Hall County: (308) 385-5175')
  doc.moveDown(0.5)

  doc.font('Helvetica-Bold').text('La Leche League')
  doc.font('Helvetica')
  doc.text('Free peer support for breastfeeding families')
  doc.text('lllofne.org for local groups')

  addFooter(doc, pageNum)
  doc.addPage()
  pageNum++
  addHeader(doc)

  addSection(doc, 'Pediatricians')
  doc.fillColor(colors.text).fontSize(11)
  doc.text(
    "Note: It's wise to choose a pediatrician before baby arrives. Most accept visits from expectant parents. Verify insurance acceptance."
  )
  doc.moveDown(0.5)
  doc.font('Helvetica-Bold').text('Kearney:')
  doc.font('Helvetica')
  addBullet(doc, 'Kearney Pediatrics: (308) 234-3250', 1)
  addBullet(doc, 'Mid-Nebraska Pediatrics: (308) 865-2400', 1)
  doc.moveDown(0.3)
  doc.font('Helvetica-Bold').text('Grand Island:')
  doc.font('Helvetica')
  addBullet(doc, 'Grand Island Pediatrics: (308) 384-7610', 1)
  addBullet(doc, 'CHI Health Pediatrics: (308) 398-5800', 1)
  doc.moveDown(0.3)
  doc.font('Helvetica-Bold').text('Hastings:')
  doc.font('Helvetica')
  addBullet(doc, 'South Heartland Pediatrics: (402) 462-2757', 1)

  addSection(doc, 'Mental Health & Postpartum Support')
  doc.fillColor(colors.text).fontSize(11)
  doc.font('Helvetica-Bold').text('Crisis Support:')
  doc.font('Helvetica')
  addBullet(doc, 'National Suicide Prevention Lifeline: 988')
  addBullet(doc, 'Postpartum Support International: 1-800-944-4773')
  addBullet(doc, 'Crisis Text Line: Text HOME to 741741')
  doc.moveDown(0.5)

  doc.font('Helvetica-Bold').text('Local Mental Health Resources:')
  doc.font('Helvetica')
  addBullet(doc, 'South Central Behavioral Services: (308) 237-5951')
  addBullet(doc, 'Region 3 Behavioral Health: 1-800-658-4482')
  addBullet(doc, 'CHI Health Behavioral Health: (308) 865-7100')

  addSection(doc, 'Community Programs')
  doc.fillColor(colors.text).fontSize(11)
  doc.font('Helvetica-Bold').text('Early Head Start')
  doc.font('Helvetica')
  doc.text('Free early childhood program for income-qualifying families')
  doc.text('Central Nebraska Community Action: (308) 865-1645')
  doc.moveDown(0.5)

  doc.font('Helvetica-Bold').text('Parents as Teachers')
  doc.font('Helvetica')
  doc.text('Free home visiting for families with children birth-5')
  doc.text('ESU 10: (308) 237-5927')

  addFooter(doc, pageNum)
  doc.addPage()
  pageNum++
  addHeader(doc)

  addSection(doc, 'Car Seat Safety')
  doc.fillColor(colors.text).fontSize(11)
  doc.font('Helvetica-Bold').text('Nurture Nest Birth')
  doc.font('Helvetica')
  doc.text('CPST certified car seat checks for clients and community')
  doc.text('nurturenestbirth.com/contact')
  doc.moveDown(0.5)

  doc.font('Helvetica-Bold').text('Local Fire Departments')
  doc.font('Helvetica')
  doc.text('Many fire departments offer car seat checks by appointment')
  doc.text('Kearney Fire: (308) 237-4444')
  doc.text('Grand Island Fire: (308) 385-5400')
  doc.moveDown(0.5)

  doc.font('Helvetica-Bold').text('Safe Kids Nebraska')
  doc.font('Helvetica')
  doc.text('Find certified technicians: safekids.org')

  addSection(doc, 'Financial Assistance')
  doc.fillColor(colors.text).fontSize(11)
  doc.font('Helvetica-Bold').text('Nebraska Medicaid (Pregnancy)')
  doc.font('Helvetica')
  doc.text('Coverage for pregnancy through 60 days postpartum')
  doc.text('ACCESSNebraska: 1-855-632-7633')
  doc.moveDown(0.5)

  doc.font('Helvetica-Bold').text('WIC (Women, Infants, Children)')
  doc.font('Helvetica')
  doc.text(
    'Nutrition assistance for pregnant/postpartum women and children under 5'
  )
  doc.text('dhhs.ne.gov/WIC')
  doc.moveDown(0.5)

  doc.font('Helvetica-Bold').text('SNAP (Food Stamps)')
  doc.font('Helvetica')
  doc.text('ACCESSNebraska: 1-855-632-7633')

  addSection(doc, 'Parenting Support Groups')
  doc.fillColor(colors.text).fontSize(11)
  addBullet(doc, 'MOPS (Mothers of Preschoolers): Check local churches')
  addBullet(doc, 'Hospital parent support groups: Ask at your birth facility')
  addBullet(
    doc,
    'Public library story times: Great for connecting with other families'
  )

  addCallout(
    doc,
    "Remember: You don't have to do this alone. Reaching out for support is a sign of strength, not weakness. Your doula can help connect you with resources that fit your family's needs.",
    'info'
  )

  addFooter(doc, pageNum)
  doc.end()
  console.log('Generated: central-nebraska-resources.pdf')
}

// ============================================
// Generate all PDFs
// ============================================
async function main() {
  console.log('Starting PDF generation...\n')

  // Ensure output directory exists
  const outputDir = path.join(__dirname, '../public/resources')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Generate all PDFs
  generateBirthPreferences()
  generateHospitalBag()
  generatePostpartumPrep()
  generateCarSeatSafety()
  generateNewbornCare()
  generateBreastfeedingGuide()
  generatePartnerGuide()
  generateProviderQuestions()
  generatePostpartumRecovery()
  generateLocalResources()

  console.log('\nAll PDFs generated successfully!')
}

main()
