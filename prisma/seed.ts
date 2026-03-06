import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create Christmas Template
  const christmasTemplate = await prisma.template.upsert({
    where: { id: 'christmas-template' },
    update: {},
    create: {
      id: 'christmas-template',
      holidaySlug: 'christmas',
      name: 'Classic Christmas Letter',

      // Visual config - S3 keys (to be uploaded separately)
      backgroundKey: 'templates/christmas/background.jpg',
      headerKey: 'templates/christmas/header.png',
      characterKey: 'templates/christmas/character.png',
      waxSealKey: 'templates/christmas/wax-seal.png',
      signatureKey: 'templates/christmas/signature.png',

      // Typography
      fontFamily: 'Special Elite',
      fontUrl: 'https://fonts.googleapis.com/css2?family=Special+Elite&display=swap',
      primaryColor: '#2c1810',
      accentColor: '#8b0000',

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

      // AI config
      character: 'Santa Claus',
      characterTone: 'warm, magical, jolly, and believes deeply in the child',
      letterPrompt: `You are Santa Claus writing a personalized letter to a child.

Your tone should be:
- Warm, magical, and jolly
- Encouraging and supportive
- Reference specific details about the child
- Mention the North Pole, elves, reindeer, and Mrs. Claus naturally
- Include references to the child's accomplishments and good behavior
- Build excitement for Christmas morning

Write a letter of 3-4 paragraphs that feels authentic and magical.
Sign it "Santa Claus" with a P.S. that adds a personal touch.`,

      storyPrompt: `You are Santa Claus creating a magical Christmas story featuring the child as the main character.

The story should:
- Be 400-500 words long
- Feature the child as the hero who helps save Christmas
- Include magical elements like flying reindeer, enchanted snowflakes, or talking toys
- Have a clear beginning, middle, and end
- Include a moral about kindness, bravery, or the spirit of giving
- Reference the child's specific interests or accomplishments when possible
- End with the child being recognized as an honorary elf or receiving a special gift

Make it engaging for the child's age and create a sense of wonder and magic.`,
    },
  });

  console.log('Created Christmas template:', christmasTemplate.id);

  // Create Christmas Programs
  const santaLetterStandard = await prisma.program.upsert({
    where: { id: 'santa-standard' },
    update: {},
    create: {
      id: 'santa-standard',
      holidaySlug: 'christmas',
      name: 'Santa Letter - Standard',
      tier: 'standard',
      deliveryTypes: ['digital', 'physical'],
      priceDigital: 19.99,
      pricePhysical: 34.99,
      isActive: true,
      templateId: christmasTemplate.id,
    },
  });

  const santaLetterDeluxe = await prisma.program.upsert({
    where: { id: 'santa-deluxe' },
    update: {},
    create: {
      id: 'santa-deluxe',
      holidaySlug: 'christmas',
      name: 'Santa Letter - Deluxe',
      tier: 'deluxe',
      deliveryTypes: ['digital', 'physical'],
      priceDigital: 29.99,
      pricePhysical: 44.99,
      isActive: true,
      templateId: christmasTemplate.id,
    },
  });

  console.log('Created programs:', santaLetterStandard.id, santaLetterDeluxe.id);

  // Create default admin user (only in development)
  if (process.env.RAILWAY_ENVIRONMENT !== 'production') {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminUser = await prisma.adminUser.upsert({
      where: { email: 'admin@northstarpostal.com' },
      update: {},
      create: {
        email: 'admin@northstarpostal.com',
        passwordHash: hashedPassword,
      },
    });

    console.log('Created admin user:', adminUser.email);
    console.log('Default password: admin123 (CHANGE THIS IN PRODUCTION!)');
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });