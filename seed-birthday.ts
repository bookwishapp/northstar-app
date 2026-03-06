// prisma/seed-birthday.ts
// Run with: npx ts-node seed-birthday.ts
// Creates the Birthday template and two programs (Standard + Deluxe)

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // -----------------------------------------------------------------------
  // TEMPLATE
  // -----------------------------------------------------------------------
  const birthdayTemplate = await prisma.template.upsert({
    where: { id: 'template-birthday' },
    update: {},
    create: {
      id: 'template-birthday',
      holidaySlug: 'birthday',
      name: 'Birthday Celebration Letter',
      location: 'Birthday Kingdom',
      isActive: true,

      // S3 asset keys — update filenames to match your actual uploads
      backgroundKey: 'templates/birthday/background.jpg',
      headerKey: 'templates/birthday/header.png',
      characterKey: 'templates/birthday/character.png',
      waxSealKey: 'templates/birthday/wax-seal.png',
      signatureKey: 'templates/birthday/signature.png',

      // Typography
      fontFamily: 'Special Elite',
      fontUrl: 'https://fonts.googleapis.com/css2?family=Special+Elite&display=swap',
      primaryColor: '#d4145a',       // birthday pink
      accentColor: '#fbb03b',        // celebration gold

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
      character: 'the Birthday Wizard',
      characterTone: 'joyful, celebratory, warm, magical, enthusiastic about birthdays and growing up',

      // -----------------------------------------------------------------------
      // LETTER PROMPT
      // -----------------------------------------------------------------------
      letterPrompt: `You are the Birthday Wizard writing a magical birthday letter to a child.

Your voice is: joyful, celebratory, warm, magical, enthusiastic. You love birthdays, celebrations, and the magic of growing another year older and wiser.

LETTER REQUIREMENTS:
- Length: 3–4 paragraphs, approximately 200–280 words
- Opens with an exciting birthday greeting that mentions their new age
- Paragraph 2: Reference the child BY NAME and celebrate 2–3 of their specific accomplishments, interests, or qualities from the past year
- Paragraph 3: Share something special about this birthday — perhaps a magical birthday wish you're granting, or something wonderful about the age they're turning
- Closes with an encouraging message about the year ahead and growing up. Sign off warmly as the Birthday Wizard.
- Tone should feel CELEBRATORY and MAGICAL — like a special birthday message just for them
- Do NOT include: [Name], [Age], or any bracket placeholders. All details come from the user message.
- Do NOT include a subject line or email formatting. Pure letter only.

OUTPUT: The letter text only. No commentary, no metadata, no subject line.`,

      // -----------------------------------------------------------------------
      // STORY PROMPT
      // -----------------------------------------------------------------------
      storyPrompt: `You are a master children's storyteller writing a personalized birthday adventure story.

The child is the HERO of this story. Their real name, age they're turning, and personal details must be woven throughout.

STORY REQUIREMENTS:
- Length: 4–6 paragraphs, approximately 350–500 words
- Title: Create a magical birthday title that includes the child's name and age (e.g., "Sophie's Seventh Birthday Adventure")
- Opening: Set the scene on their birthday or the magical night before. Ground it in their world.
- Rising action: The child discovers something magical related to their birthday — a portal to the Birthday Kingdom, a magical gift, a birthday quest
- Use their interests and strengths to drive the story. If they love art, maybe they paint a magical door. If they play soccer, maybe they kick a ball that opens a portal.
- Climax: A wonderful birthday surprise or magical moment just for them
- Resolution: Warm and satisfying. The child returns with something special (wisdom, confidence, a magical gift)
- Closing line: A beautiful sentence about growing up and the magic of their specific age

STYLE NOTES:
- Age-appropriate vocabulary
- Vivid, celebratory language — colors, sounds, birthday magic
- The child should feel genuinely CELEBRATED
- Magical but believable for a child
- Do NOT use bracket placeholders. All details come from the user message.

OUTPUT FORMAT:
[Story Title]

[Story text — paragraphs separated by blank lines]

No commentary, no metadata. Title on first line, then story.`,
    }
  })

  console.log('✓ Birthday template created:', birthdayTemplate.id)

  // -----------------------------------------------------------------------
  // PROGRAMS
  // -----------------------------------------------------------------------

  const standardProgram = await prisma.program.upsert({
    where: { id: 'program-birthday-standard' },
    update: {},
    create: {
      id: 'program-birthday-standard',
      holidaySlug: 'birthday',
      name: 'Birthday Letter — Standard',
      tier: 'standard',
      deliveryTypes: ['digital'],
      priceDigital: 8.99,
      pricePhysical: null,
      isActive: true,
      templateId: 'template-birthday',
    }
  })

  console.log('✓ Birthday Standard program created:', standardProgram.id)

  const deluxeProgram = await prisma.program.upsert({
    where: { id: 'program-birthday-deluxe' },
    update: {},
    create: {
      id: 'program-birthday-deluxe',
      holidaySlug: 'birthday',
      name: 'Birthday Letter — Deluxe',
      tier: 'deluxe',
      deliveryTypes: ['digital', 'physical'],
      priceDigital: 14.99,
      pricePhysical: 24.99,
      isActive: true,
      templateId: 'template-birthday',
    }
  })

  console.log('✓ Birthday Deluxe program created:', deluxeProgram.id)

  // -----------------------------------------------------------------------
  // CLAIM FIELDS CONFIG
  // -----------------------------------------------------------------------
  console.log(`
✓ Birthday claim fields (add to lib/claim-fields.ts):

birthday: [
  {
    key: 'newAge',
    label: "What age are they turning?",
    placeholder: "5, 6, 7...",
    type: 'text',
    required: true,
  },
  {
    key: 'accomplishments',
    label: "What are they proud of from this past year?",
    placeholder: "Learned to ride a bike, made the soccer team, read 50 books...",
    type: 'textarea',
    required: true,
  },
  {
    key: 'currentInterests',
    label: "What are they really into right now?",
    placeholder: "Pokemon, gymnastics, Lego, drawing...",
    type: 'text',
    required: true,
  },
  {
    key: 'birthdayWish',
    label: "What's their big birthday wish?",
    placeholder: "A puppy, to learn guitar, to visit Disneyland...",
    type: 'text',
    required: false,
  },
  {
    key: 'specialQualities',
    label: "What makes them special?",
    placeholder: "Kind to everyone, creative, funny, brave...",
    type: 'textarea',
    required: false,
  },
]
`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())