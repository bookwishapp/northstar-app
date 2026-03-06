// prisma/seed-stpatricks.ts
// Run with: npx ts-node seed-stpatricks.ts
// Creates the St. Patrick's Day template and two programs (Standard + Deluxe)

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // -----------------------------------------------------------------------
  // TEMPLATE
  // -----------------------------------------------------------------------
  const stpatricksTemplate = await prisma.template.upsert({
    where: { id: 'template-stpatricks' },
    update: {},
    create: {
      id: 'template-stpatricks',
      holidaySlug: 'stpatricks',
      name: "Leprechaun's Lucky Letter",
      location: 'End of the Rainbow',
      isActive: true,

      // S3 asset keys — update filenames to match your actual uploads
      backgroundKey: 'templates/stpatricks/background.jpg',
      headerKey: 'templates/stpatricks/header.png',
      characterKey: 'templates/stpatricks/character.png',
      waxSealKey: 'templates/stpatricks/wax-seal.png',
      signatureKey: 'templates/stpatricks/signature.png',

      // Typography
      fontFamily: 'Special Elite',
      fontUrl: 'https://fonts.googleapis.com/css2?family=Special+Elite&display=swap',
      primaryColor: '#00a652',       // irish green
      accentColor: '#ffd700',        // pot of gold

      // Layout
      paperSize: 'letter',
      marginTop: '1.2in',
      marginBottom: '1in',
      marginLeft: '0.9in',
      marginRight: '0.9in',

      // Multi-page behavior
      repeatBackground: true,
      headerFirstPageOnly: true,
      waxSealLastPageOnly: true,

      // AI character config
      character: 'Lucky the Leprechaun',
      characterTone: 'mischievous, cheerful, Irish-accented in spirit, loves luck and gold and rainbows',

      // -----------------------------------------------------------------------
      // LETTER PROMPT
      // -----------------------------------------------------------------------
      letterPrompt: `You are Lucky the Leprechaun writing a magical St. Patrick's Day letter to a child.

Your voice is: mischievous, cheerful, playful, with a hint of Irish charm (but not overdone). You love luck, gold, rainbows, and finding four-leaf clovers.

LETTER REQUIREMENTS:
- Length: 3–4 paragraphs, approximately 200–280 words
- Opens with a cheerful St. Patrick's Day greeting mentioning rainbows, gold, or Irish luck
- Paragraph 2: Reference the child BY NAME and celebrate their lucky moments, achievements, or special qualities that make them lucky to know
- Paragraph 3: Share a leprechaun secret — maybe where you've hidden a special shamrock, or how they can make their own luck
- Closes with a blessing of good luck and Irish cheer. Sign off as Lucky the Leprechaun.
- Tone should be PLAYFUL and MAGICAL — mischievous but kind
- Do NOT include: [Name], [Age], or any bracket placeholders. All details come from the user message.
- Do NOT include a subject line or email formatting. Pure letter only.
- Avoid stereotypes — focus on luck, nature, and magic rather than cultural clichés

OUTPUT: The letter text only. No commentary, no metadata, no subject line.`,

      // -----------------------------------------------------------------------
      // STORY PROMPT
      // -----------------------------------------------------------------------
      storyPrompt: `You are a master children's storyteller writing a personalized St. Patrick's Day adventure story.

The child is the HERO of this story. Their real name and personal details must be woven throughout.

STORY REQUIREMENTS:
- Length: 4–6 paragraphs, approximately 350–500 words
- Title: Create a lucky title with the child's name (e.g., "Liam's Lucky Rainbow Adventure")
- Opening: Set the scene on St. Patrick's Day morning. The child notices something magical — a rainbow, golden sparkles, tiny footprints
- Rising action: The child follows clues or helps a leprechaun in trouble. Maybe they need to find a lost pot of gold or help protect the rainbow
- Use their qualities to drive success. If they're observant, they spot clues. If they're kind, their kindness is rewarded with luck.
- Climax: A magical discovery — finding the leprechaun's treasure, earning a lucky charm, or saving St. Patrick's Day
- Resolution: The child gains something special (luck, confidence, a magical shamrock) and returns home
- Closing line: A beautiful sentence about making your own luck through kindness and courage

STYLE NOTES:
- Age-appropriate vocabulary
- Vivid imagery — rainbows, green fields, golden light
- The child should feel LUCKY and CLEVER
- Magical but grounded in values of kindness bringing luck
- Do NOT use bracket placeholders. All details come from the user message.
- Avoid cultural stereotypes — focus on magical elements

OUTPUT FORMAT:
[Story Title]

[Story text — paragraphs separated by blank lines]

No commentary, no metadata. Title on first line, then story.`,
    }
  })

  console.log('✓ St. Patrick\'s Day template created:', stpatricksTemplate.id)

  // -----------------------------------------------------------------------
  // PROGRAMS
  // -----------------------------------------------------------------------

  const standardProgram = await prisma.program.upsert({
    where: { id: 'program-stpatricks-standard' },
    update: {},
    create: {
      id: 'program-stpatricks-standard',
      holidaySlug: 'stpatricks',
      name: 'St. Patrick\'s Day Letter — Standard',
      tier: 'standard',
      deliveryTypes: ['digital'],
      priceDigital: 8.99,
      pricePhysical: null,
      isActive: true,
      templateId: 'template-stpatricks',
    }
  })

  console.log('✓ St. Patrick\'s Day Standard program created:', standardProgram.id)

  const deluxeProgram = await prisma.program.upsert({
    where: { id: 'program-stpatricks-deluxe' },
    update: {},
    create: {
      id: 'program-stpatricks-deluxe',
      holidaySlug: 'stpatricks',
      name: 'St. Patrick\'s Day Letter — Deluxe',
      tier: 'deluxe',
      deliveryTypes: ['digital', 'physical'],
      priceDigital: 14.99,
      pricePhysical: 24.99,
      isActive: true,
      templateId: 'template-stpatricks',
    }
  })

  console.log('✓ St. Patrick\'s Day Deluxe program created:', deluxeProgram.id)

  // -----------------------------------------------------------------------
  // CLAIM FIELDS CONFIG
  // -----------------------------------------------------------------------
  console.log(`
✓ St. Patrick's Day claim fields (add to lib/claim-fields.ts):

stpatricks: [
  {
    key: 'luckyMoment',
    label: "What's a lucky or special moment they had this year?",
    placeholder: "Won a contest, made a new friend, found something special...",
    type: 'textarea',
    required: true,
  },
  {
    key: 'specialTalent',
    label: "What's their special talent or skill?",
    placeholder: "Great at sports, tells funny jokes, amazing artist...",
    type: 'text',
    required: true,
  },
  {
    key: 'makesThemLucky',
    label: "What makes them feel lucky?",
    placeholder: "Their family, their pet, their friends...",
    type: 'text',
    required: true,
  },
  {
    key: 'favoriteGreenThing',
    label: "What's their favorite green thing?",
    placeholder: "Green apples, grass, their green bike... (optional)",
    type: 'text',
    required: false,
  },
  {
    key: 'wishForLuck',
    label: "What would they wish for if they found a pot of gold?",
    placeholder: "A treehouse, world peace, a puppy... (optional)",
    type: 'text',
    required: false,
  },
]
`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())