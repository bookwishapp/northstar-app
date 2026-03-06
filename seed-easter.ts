// prisma/seed-easter.ts
// Run with: npx ts-node prisma/seed-easter.ts
// Creates the Easter Bunny template and two programs (Standard + Deluxe)

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // -----------------------------------------------------------------------
  // TEMPLATE
  // S3 asset keys assume you've uploaded graphics to:
  //   s3://northstar-postal/templates/easter/
  // Update these keys to match your actual S3 filenames.
  // -----------------------------------------------------------------------
  const easterTemplate = await prisma.template.upsert({
    where: { id: 'template-easter' },
    update: {},
    create: {
      id: 'template-easter',
      holidaySlug: 'easter',
      name: 'Easter Bunny Letter',
      location: 'Easter Garden',
      isActive: true,

      // S3 asset keys — update filenames to match your actual uploads
      backgroundKey: 'templates/easter/background.jpg',
      headerKey: 'templates/easter/header.png',
      characterKey: 'templates/easter/character.png',
      waxSealKey: 'templates/easter/wax-seal.png',
      signatureKey: 'templates/easter/signature.png',

      // Typography
      fontFamily: 'Special Elite',
      fontUrl: 'https://fonts.googleapis.com/css2?family=Special+Elite&display=swap',
      primaryColor: '#2d5a1b',       // deep spring green
      accentColor: '#7b3f9e',        // easter purple

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
      character: 'the Easter Bunny',
      characterTone: 'cheerful, playful, warm, slightly mischievous, deeply encouraging, loves spring and new beginnings',

      // -----------------------------------------------------------------------
      // LETTER PROMPT
      // GPT-4o system prompt for generating the personalized letter
      // -----------------------------------------------------------------------
      letterPrompt: `You are the Easter Bunny writing a warm, personalized letter to a child.

Your voice is: cheerful, playful, warm, slightly mischievous, deeply encouraging. You love spring, new beginnings, hidden eggs, and the magic of Easter morning. You believe every child is special and worthy of celebration.

LETTER REQUIREMENTS:
- Length: 3–4 paragraphs, approximately 200–280 words
- Opens with a joyful Easter greeting that mentions the season (spring blooms, warming days, etc.)
- Paragraph 2: Reference the child BY NAME and weave in 2–3 of their specific details naturally — accomplishments, interests, pets, siblings. Make it feel like you've been watching them with delight, not in a creepy way, but in the magical way only the Easter Bunny can.
- Paragraph 3: Tell them something special about this Easter — maybe a particularly tricky hiding spot you've planned, or a special egg just for them, or a note about what the Easter helpers said about them.
- Closes with an encouraging, age-appropriate message about spring, growth, and the magic ahead. Sign off warmly as the Easter Bunny.
- Tone should feel REAL and MAGICAL — like an actual letter a child would treasure, not a generic template.
- Do NOT include: [Name], [Age], or any bracket placeholders. All details come from the user message.
- Do NOT include a subject line or email formatting. Pure letter only.
- Do NOT start with "Dear" — start with something more magical and seasonal.

OUTPUT: The letter text only. No commentary, no metadata, no subject line.`,

      // -----------------------------------------------------------------------
      // STORY PROMPT
      // GPT-4o system prompt for generating the personalized story page
      // -----------------------------------------------------------------------
      storyPrompt: `You are a master children's storyteller writing a personalized Easter adventure story for a specific child.

The child is the HERO of this story. Their real name, age, and personal details must be woven throughout — not just mentioned once, but integral to the plot.

STORY REQUIREMENTS:
- Length: 4–6 paragraphs, approximately 350–500 words
- Title: Create a magical, personalized title that includes the child's name (e.g., "Emma and the Golden Easter Egg" or "The Easter Adventure of Jake the Brave")
- Opening: Set the scene on Easter morning or the eve before. Ground it in a real, cozy setting (their home, backyard, neighborhood) and introduce the child by name immediately.
- Rising action: The child discovers something magical — a glowing egg, a note from the Easter Bunny, a trail of clues. Their specific interests or strengths (from the personalization details) should be what helps them succeed. If they love dinosaurs, maybe the Easter eggs are dinosaur-themed. If they're good at puzzles, the clues are puzzle-based.
- Climax: A moment of wonder — meeting a magical Easter creature, finding a hidden garden, discovering a surprise meant just for them.
- Resolution: Warm, satisfying, age-appropriate. The child returns home with something magical (real or felt). Ends on a note of wonder and possibility.
- Closing line: A short, beautiful closing sentence that ties back to who the child is specifically.

STYLE NOTES:
- Age-appropriate vocabulary — adjust complexity based on the child's age
- Vivid, sensory language — spring smells, colors, sounds
- The child should feel genuinely SEEN — their details aren't decoration, they drive the story
- Magical but believable for a child — wonder without being scary
- Do NOT use bracket placeholders. All details come from the user message.

OUTPUT FORMAT:
[Story Title]

[Story text — paragraphs separated by blank lines]

No commentary, no metadata. Title on first line, then story.`,
    }
  })

  console.log('✓ Easter template created:', easterTemplate.id)

  // -----------------------------------------------------------------------
  // PROGRAMS
  // -----------------------------------------------------------------------

  const standardProgram = await prisma.program.upsert({
    where: { id: 'program-easter-standard' },
    update: {},
    create: {
      id: 'program-easter-standard',
      holidaySlug: 'easter',
      name: 'Easter Bunny Letter — Standard',
      tier: 'standard',
      deliveryTypes: ['digital'],
      priceDigital: 8.99,
      pricePhysical: null,
      isActive: true,
      templateId: 'template-easter',
    }
  })

  console.log('✓ Easter Standard program created:', standardProgram.id)

  const deluxeProgram = await prisma.program.upsert({
    where: { id: 'program-easter-deluxe' },
    update: {},
    create: {
      id: 'program-easter-deluxe',
      holidaySlug: 'easter',
      name: 'Easter Bunny Letter — Deluxe',
      tier: 'deluxe',
      deliveryTypes: ['digital', 'physical'],
      priceDigital: 14.99,
      pricePhysical: 24.99,
      isActive: true,
      templateId: 'template-easter',
    }
  })

  console.log('✓ Easter Deluxe program created:', deluxeProgram.id)

  // -----------------------------------------------------------------------
  // CLAIM FIELDS CONFIG
  // These define the personalization form fields for Easter orders.
  // This is a reference — copy into lib/claim-fields.ts in your app.
  // -----------------------------------------------------------------------
  console.log(`
✓ Easter claim fields (copy to lib/claim-fields.ts):

easter: [
  {
    key: 'favoriteSpringActivity',
    label: "What's their favorite thing about spring?",
    placeholder: "Playing outside, looking for bugs, riding their bike...",
    type: 'text',
    required: true,
  },
  {
    key: 'bigAccomplishment',
    label: "What's something great they've done recently?",
    placeholder: "Learned to read, made a new friend, helped someone...",
    type: 'text',
    required: true,
  },
  {
    key: 'currentInterest',
    label: "What are they really into right now?",
    placeholder: "Dinosaurs, Minecraft, gymnastics, drawing...",
    type: 'text',
    required: true,
  },
  {
    key: 'petOrSibling',
    label: "Any pets or siblings the Easter Bunny should mention?",
    placeholder: "Dog named Max, little sister Lily... (optional)",
    type: 'text',
    required: false,
  },
  {
    key: 'favoriteColor',
    label: "What's their favorite color?",
    placeholder: "Purple, rainbow, blue...",
    type: 'text',
    required: false,
  },
]
`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
