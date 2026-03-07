import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// TEMPORARY ENDPOINT - DELETE AFTER USE
export async function GET() {
  try {
    // Easter Template & Programs
    const easterTemplate = await prisma.template.upsert({
      where: { slug: 'easter' },
      update: {},
      create: {
        slug: 'easter',
        character: 'the Easter Bunny',
        characterTone: 'Cheerful, playful, and magical, with a love for springtime, chocolate eggs, and joyful surprises. Mentions hopping, egg hunts, and spring flowers frequently.',
        primaryColor: '#2c1810',
        accentColor: '#8b0000',
        letterPrompt: `You are writing as the Easter Bunny...`,
        storyPrompt: `Create a magical Easter story...`,
      },
    });

    await prisma.program.createMany({
      data: [
        {
          holidaySlug: 'easter',
          templateId: easterTemplate.id,
          name: 'Easter Bunny Letter — Standard',
          tier: 'standard',
          deliveryTypes: ['digital'],
          priceDigital: 29.99,
          isActive: true,
        },
        {
          holidaySlug: 'easter',
          templateId: easterTemplate.id,
          name: 'Easter Bunny Letter — Deluxe',
          tier: 'deluxe',
          deliveryTypes: ['digital', 'physical'],
          priceDigital: 39.99,
          pricePhysical: 59.99,
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    // Valentine Template & Programs
    const valentineTemplate = await prisma.template.upsert({
      where: { slug: 'valentine' },
      update: {},
      create: {
        slug: 'valentine',
        character: 'Cupid',
        characterTone: 'Sweet, romantic, and playful with a touch of mischief. Talks about love, hearts, and spreading kindness.',
        primaryColor: '#8b0020',
        accentColor: '#ff69b4',
        letterPrompt: `You are writing as Cupid...`,
        storyPrompt: `Create a heartwarming Valentine's Day story...`,
      },
    });

    await prisma.program.createMany({
      data: [
        {
          holidaySlug: 'valentine',
          templateId: valentineTemplate.id,
          name: 'Cupid Letter — Standard',
          tier: 'standard',
          deliveryTypes: ['digital'],
          priceDigital: 24.99,
          isActive: true,
        },
        {
          holidaySlug: 'valentine',
          templateId: valentineTemplate.id,
          name: 'Cupid Letter — Deluxe',
          tier: 'deluxe',
          deliveryTypes: ['digital', 'physical'],
          priceDigital: 34.99,
          pricePhysical: 54.99,
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    // Halloween Template & Programs
    const halloweenTemplate = await prisma.template.upsert({
      where: { slug: 'halloween' },
      update: {},
      create: {
        slug: 'halloween',
        character: 'the Great Pumpkin',
        characterTone: 'Mysterious but friendly, with a love for autumn, candy, and spooky fun. Not scary, just delightfully spooky!',
        primaryColor: '#ff6600',
        accentColor: '#000000',
        letterPrompt: `You are writing as the Great Pumpkin...`,
        storyPrompt: `Create a fun Halloween adventure...`,
      },
    });

    await prisma.program.createMany({
      data: [
        {
          holidaySlug: 'halloween',
          templateId: halloweenTemplate.id,
          name: 'Great Pumpkin Letter — Standard',
          tier: 'standard',
          deliveryTypes: ['digital'],
          priceDigital: 24.99,
          isActive: true,
        },
        {
          holidaySlug: 'halloween',
          templateId: halloweenTemplate.id,
          name: 'Great Pumpkin Letter — Deluxe',
          tier: 'deluxe',
          deliveryTypes: ['digital', 'physical'],
          priceDigital: 34.99,
          pricePhysical: 54.99,
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    // St. Patrick's Template & Programs
    const stpatricksTemplate = await prisma.template.upsert({
      where: { slug: 'stpatricks' },
      update: {},
      create: {
        slug: 'stpatricks',
        character: 'Finnegan the Leprechaun',
        characterTone: 'Mischievous, lucky, and full of Irish charm. Speaks with Irish expressions and loves rainbows, pots of gold, and shamrocks.',
        primaryColor: '#008000',
        accentColor: '#ffd700',
        letterPrompt: `You are writing as Finnegan the Leprechaun...`,
        storyPrompt: `Create a lucky St. Patrick's Day adventure...`,
      },
    });

    await prisma.program.createMany({
      data: [
        {
          holidaySlug: 'stpatricks',
          templateId: stpatricksTemplate.id,
          name: 'Leprechaun Letter — Standard',
          tier: 'standard',
          deliveryTypes: ['digital'],
          priceDigital: 24.99,
          isActive: true,
        },
        {
          holidaySlug: 'stpatricks',
          templateId: stpatricksTemplate.id,
          name: 'Leprechaun Letter — Deluxe',
          tier: 'deluxe',
          deliveryTypes: ['digital', 'physical'],
          priceDigital: 34.99,
          pricePhysical: 54.99,
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    // Birthday Template & Programs
    const birthdayTemplate = await prisma.template.upsert({
      where: { slug: 'birthday' },
      update: {},
      create: {
        slug: 'birthday',
        character: 'Sparkles the Birthday Fairy',
        characterTone: 'Excited, celebratory, and magical. Loves cake, presents, and making birthday wishes come true!',
        primaryColor: '#ff1493',
        accentColor: '#ffd700',
        letterPrompt: `You are writing as Sparkles the Birthday Fairy...`,
        storyPrompt: `Create a magical birthday adventure...`,
      },
    });

    await prisma.program.createMany({
      data: [
        {
          holidaySlug: 'birthday',
          templateId: birthdayTemplate.id,
          name: 'Birthday Fairy Letter — Standard',
          tier: 'standard',
          deliveryTypes: ['digital'],
          priceDigital: 24.99,
          isActive: true,
        },
        {
          holidaySlug: 'birthday',
          templateId: birthdayTemplate.id,
          name: 'Birthday Fairy Letter — Deluxe',
          tier: 'deluxe',
          deliveryTypes: ['digital', 'physical'],
          priceDigital: 34.99,
          pricePhysical: 54.99,
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    const templates = await prisma.template.count();
    const programs = await prisma.program.count();

    return NextResponse.json({
      message: 'Holidays seeded successfully',
      templates,
      programs,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed holidays' },
      { status: 500 }
    );
  }
}