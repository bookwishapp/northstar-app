// prisma/seed-halloween.ts
// Run with: npx ts-node seed-halloween.ts
// Creates the Halloween template and two programs (Standard + Deluxe)

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // -----------------------------------------------------------------------
  // TEMPLATE
  // -----------------------------------------------------------------------
  const halloweenTemplate = await prisma.template.upsert({
    where: { id: 'template-halloween' },
    update: {},
    create: {
      id: 'template-halloween',
      holidaySlug: 'halloween',
      name: 'Halloween Spirit Letter',
      location: 'Spooky Hollow',
      isActive: true,

      // S3 asset keys — update filenames to match your actual uploads
      backgroundKey: 'templates/halloween/background.jpg',
      headerKey: 'templates/halloween/header.png',
      characterKey: 'templates/halloween/character.png',
      waxSealKey: 'templates/halloween/wax-seal.png',
      signatureKey: 'templates/halloween/signature.png',

      // Typography
      fontFamily: 'Special Elite',
      fontUrl: 'https://fonts.googleapis.com/css2?family=Special+Elite&display=swap',
      primaryColor: '#ff6b35',       // halloween orange
      accentColor: '#4a148c',        // spooky purple

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
      character: 'the Great Pumpkin Spirit',
      characterTone: 'playfully spooky, warm, encouraging bravery and creativity, loves costumes and trick-or-treating',

      // -----------------------------------------------------------------------
      // LETTER PROMPT
      // -----------------------------------------------------------------------
      letterPrompt: `You are the Great Pumpkin Spirit writing a fun Halloween letter to a child.

Your voice is: playfully spooky (never scary), warm, encouraging, excited about Halloween fun. You love costumes, creativity, trick-or-treating, and the magic of Halloween night.

LETTER REQUIREMENTS:
- Length: 3–4 paragraphs, approximately 200–280 words
- Opens with a fun Halloween greeting mentioning autumn leaves, jack-o'-lanterns, or Halloween preparations
- Paragraph 2: Reference the child BY NAME and their Halloween plans — costume choice, decorating activities, or what makes them brave
- Paragraph 3: Share a playful Halloween message — maybe about the best trick-or-treating spots, or a friendly ghost who watches over brave kids
- Closes with encouragement about creativity, bravery, and Halloween fun. Sign off as the Great Pumpkin Spirit.
- Tone should be FUN and PLAYFUL — spooky but never scary, always age-appropriate
- Do NOT include: [Name], [Age], or any bracket placeholders. All details come from the user message.
- Do NOT include a subject line or email formatting. Pure letter only.

OUTPUT: The letter text only. No commentary, no metadata, no subject line.`,

      // -----------------------------------------------------------------------
      // STORY PROMPT
      // -----------------------------------------------------------------------
      storyPrompt: `You are a master children's storyteller writing a personalized Halloween adventure story.

The child is the HERO of this story. Their real name, costume choice, and personal details must be woven throughout.

STORY REQUIREMENTS:
- Length: 4–6 paragraphs, approximately 350–500 words
- Title: Create a fun Halloween title with the child's name (e.g., "Maya's Magical Halloween Night")
- Opening: Set the scene on Halloween evening. The child is in their costume, ready for adventure
- Rising action: The child encounters a fun Halloween mystery — a friendly ghost needs help, a magical pumpkin grants wishes, or they find a map to the best candy
- Use their costume and personality in the story. If they're a superhero, they use those powers. If they're creative, they solve problems cleverly.
- Climax: A fun Halloween triumph — helping a friendly monster, finding magical candy, or saving Halloween
- Resolution: The child returns home with a special Halloween memory or magical treat
- Closing line: A warm sentence about Halloween magic and bravery

STYLE NOTES:
- Age-appropriate vocabulary — fun spooky, never actually scary
- Vivid Halloween imagery — autumn colors, jack-o'-lanterns, costumes
- The child should feel BRAVE and CREATIVE
- Magical and adventurous but not frightening
- Do NOT use bracket placeholders. All details come from the user message.

OUTPUT FORMAT:
[Story Title]

[Story text — paragraphs separated by blank lines]

No commentary, no metadata. Title on first line, then story.`,
    }
  })

  console.log('✓ Halloween template created:', halloweenTemplate.id)

  // -----------------------------------------------------------------------
  // PROGRAMS
  // -----------------------------------------------------------------------

  const standardProgram = await prisma.program.upsert({
    where: { id: 'program-halloween-standard' },
    update: {},
    create: {
      id: 'program-halloween-standard',
      holidaySlug: 'halloween',
      name: 'Halloween Letter — Standard',
      tier: 'standard',
      deliveryTypes: ['digital'],
      priceDigital: 8.99,
      pricePhysical: null,
      isActive: true,
      templateId: 'template-halloween',
    }
  })

  console.log('✓ Halloween Standard program created:', standardProgram.id)

  const deluxeProgram = await prisma.program.upsert({
    where: { id: 'program-halloween-deluxe' },
    update: {},
    create: {
      id: 'program-halloween-deluxe',
      holidaySlug: 'halloween',
      name: 'Halloween Letter — Deluxe',
      tier: 'deluxe',
      deliveryTypes: ['digital', 'physical'],
      priceDigital: 14.99,
      pricePhysical: 24.99,
      isActive: true,
      templateId: 'template-halloween',
    }
  })

  console.log('✓ Halloween Deluxe program created:', deluxeProgram.id)

  // -----------------------------------------------------------------------
  // CLAIM FIELDS CONFIG
  // -----------------------------------------------------------------------
  console.log(`
✓ Halloween claim fields (add to lib/claim-fields.ts):

halloween: [
  {
    key: 'costume',
    label: "What's their Halloween costume this year?",
    placeholder: "Astronaut, princess, dinosaur, superhero...",
    type: 'text',
    required: true,
  },
  {
    key: 'favoriteCandy',
    label: "What's their favorite Halloween candy?",
    placeholder: "Chocolate bars, gummy bears, lollipops...",
    type: 'text',
    required: true,
  },
  {
    key: 'halloweenActivity',
    label: "What Halloween activity do they love?",
    placeholder: "Carving pumpkins, trick-or-treating, decorating...",
    type: 'text',
    required: true,
  },
  {
    key: 'braveMoment',
    label: "When have they been brave recently?",
    placeholder: "Tried something new, stood up for a friend...",
    type: 'textarea',
    required: false,
  },
  {
    key: 'bestFriend',
    label: "Who are they trick-or-treating with?",
    placeholder: "Best friend Emma, siblings, cousins... (optional)",
    type: 'text',
    required: false,
  },
]
`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())