// prisma/seed-valentine.ts
// Run with: npx ts-node seed-valentine.ts
// Creates the Valentine's Day template and two programs (Standard + Deluxe)

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // -----------------------------------------------------------------------
  // TEMPLATE
  // -----------------------------------------------------------------------
  const valentineTemplate = await prisma.template.upsert({
    where: { id: 'template-valentine' },
    update: {},
    create: {
      id: 'template-valentine',
      holidaySlug: 'valentine',
      name: "Cupid's Valentine Letter",
      location: 'Cloud Nine',
      isActive: true,

      // S3 asset keys — update filenames to match your actual uploads
      backgroundKey: 'templates/valentine/background.jpg',
      headerKey: 'templates/valentine/header.png',
      characterKey: 'templates/valentine/character.png',
      waxSealKey: 'templates/valentine/wax-seal.png',
      signatureKey: 'templates/valentine/signature.png',

      // Typography
      fontFamily: 'Special Elite',
      fontUrl: 'https://fonts.googleapis.com/css2?family=Special+Elite&display=swap',
      primaryColor: '#d63384',       // valentine pink
      accentColor: '#ff6b9d',        // soft pink

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
      character: 'Cupid',
      characterTone: 'warm, caring, playful, appreciative of love and friendship, encouraging kindness',

      // -----------------------------------------------------------------------
      // LETTER PROMPT
      // -----------------------------------------------------------------------
      letterPrompt: `You are Cupid writing a warm Valentine's Day letter to a child.

Your voice is: warm, caring, playful, appreciative. You celebrate all kinds of love — family love, friendship, kindness to others, and self-love.

LETTER REQUIREMENTS:
- Length: 3–4 paragraphs, approximately 200–280 words
- Opens with a warm Valentine's greeting about love and kindness
- Paragraph 2: Reference the child BY NAME and celebrate their kind actions, friendships, or ways they show love to family/friends
- Paragraph 3: Share a message about the different kinds of love in their life — family, friends, pets, hobbies they love
- Closes with encouragement about spreading kindness and love. Sign off warmly as Cupid.
- Tone should be WARM and INCLUSIVE — celebrating all forms of love appropriate for children
- Do NOT include: [Name], [Age], or any bracket placeholders. All details come from the user message.
- Do NOT include a subject line or email formatting. Pure letter only.

OUTPUT: The letter text only. No commentary, no metadata, no subject line.`,

      // -----------------------------------------------------------------------
      // STORY PROMPT
      // -----------------------------------------------------------------------
      storyPrompt: `You are a master children's storyteller writing a personalized Valentine's adventure story.

The child is the HERO of this story. Their real name and personal details must be woven throughout.

STORY REQUIREMENTS:
- Length: 4–6 paragraphs, approximately 350–500 words
- Title: Create a heartwarming title with the child's name (e.g., "How Emma Saved Valentine's Day")
- Opening: Set the scene around Valentine's Day. The child is preparing valentines or noticing something amiss
- Rising action: The child discovers that love/kindness is missing or needs help — maybe Cupid lost his arrows, or the Valentine mail got mixed up
- Use their personality traits to solve the problem. If they're creative, they make new arrows. If they're organized, they sort the mail.
- Climax: The child helps restore love/kindness to Valentine's Day through their special qualities
- Resolution: Valentine's Day is saved, and the child learns about the power of their own kindness
- Closing line: A beautiful sentence about love and kindness

STYLE NOTES:
- Age-appropriate vocabulary
- Warm, heartfelt language — focus on friendship and kindness
- The child should feel like a HERO of kindness
- Magical but grounded in values of love and friendship
- Do NOT use bracket placeholders. All details come from the user message.

OUTPUT FORMAT:
[Story Title]

[Story text — paragraphs separated by blank lines]

No commentary, no metadata. Title on first line, then story.`,
    }
  })

  console.log('✓ Valentine template created:', valentineTemplate.id)

  // -----------------------------------------------------------------------
  // PROGRAMS
  // -----------------------------------------------------------------------

  const standardProgram = await prisma.program.upsert({
    where: { id: 'program-valentine-standard' },
    update: {},
    create: {
      id: 'program-valentine-standard',
      holidaySlug: 'valentine',
      name: 'Valentine Letter — Standard',
      tier: 'standard',
      deliveryTypes: ['digital'],
      priceDigital: 8.99,
      pricePhysical: null,
      isActive: true,
      templateId: 'template-valentine',
    }
  })

  console.log('✓ Valentine Standard program created:', standardProgram.id)

  const deluxeProgram = await prisma.program.upsert({
    where: { id: 'program-valentine-deluxe' },
    update: {},
    create: {
      id: 'program-valentine-deluxe',
      holidaySlug: 'valentine',
      name: 'Valentine Letter — Deluxe',
      tier: 'deluxe',
      deliveryTypes: ['digital', 'physical'],
      priceDigital: 14.99,
      pricePhysical: 24.99,
      isActive: true,
      templateId: 'template-valentine',
    }
  })

  console.log('✓ Valentine Deluxe program created:', deluxeProgram.id)

  // -----------------------------------------------------------------------
  // CLAIM FIELDS CONFIG
  // -----------------------------------------------------------------------
  console.log(`
✓ Valentine claim fields (add to lib/claim-fields.ts):

valentine: [
  {
    key: 'kindActions',
    label: "How have they shown kindness recently?",
    placeholder: "Helped a friend, shared their toys, made someone smile...",
    type: 'textarea',
    required: true,
  },
  {
    key: 'bestFriends',
    label: "Who are their best friends?",
    placeholder: "Sarah from school, cousin Jake, neighbor Emma...",
    type: 'text',
    required: true,
  },
  {
    key: 'showsLove',
    label: "How do they show love to family?",
    placeholder: "Hugs, helping with chores, drawing pictures...",
    type: 'text',
    required: true,
  },
  {
    key: 'favoriteActivities',
    label: "What do they love doing?",
    placeholder: "Reading, playing soccer, building with Lego...",
    type: 'text',
    required: false,
  },
  {
    key: 'pets',
    label: "Any pets they love?",
    placeholder: "Dog named Max, cat named Whiskers... (optional)",
    type: 'text',
    required: false,
  },
]
`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())