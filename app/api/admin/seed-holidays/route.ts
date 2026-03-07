import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// TEMPORARY ENDPOINT - DELETE AFTER USE
export async function GET() {
  try {
    // Clean approach - check and create all templates
    const holidays = [
      { slug: 'easter', name: 'Easter', character: 'the Easter Bunny', color1: '#2c1810', color2: '#8b0000' },
      { slug: 'valentine', name: 'Valentine', character: 'Cupid', color1: '#8b0020', color2: '#ff69b4' },
      { slug: 'halloween', name: 'Halloween', character: 'the Great Pumpkin', color1: '#ff6600', color2: '#000000' },
      { slug: 'stpatricks', name: 'St Patricks', character: 'Finnegan the Leprechaun', color1: '#008000', color2: '#ffd700' },
      { slug: 'birthday', name: 'Birthday', character: 'Sparkles the Birthday Fairy', color1: '#ff1493', color2: '#ffd700' },
    ];

    for (const h of holidays) {
      let template = await prisma.template.findFirst({ where: { holidaySlug: h.slug } });

      if (!template) {
        template = await prisma.template.create({
          data: {
            holidaySlug: h.slug,
            name: h.name,
            character: h.character,
            characterTone: 'Magical and wonderful',
            primaryColor: h.color1,
            accentColor: h.color2,
            letterPrompt: `You are ${h.character}...`,
            storyPrompt: `Create a ${h.name} story...`,
          },
        });
      }

      await prisma.program.createMany({
        data: [
          {
            holidaySlug: h.slug,
            templateId: template.id,
            name: `${h.name} Letter — Standard`,
            tier: 'standard',
            deliveryTypes: ['digital'],
            priceDigital: 24.99,
            isActive: true,
          },
          {
            holidaySlug: h.slug,
            templateId: template.id,
            name: `${h.name} Letter — Deluxe`,
            tier: 'deluxe',
            deliveryTypes: ['digital', 'physical'],
            priceDigital: 34.99,
            pricePhysical: 54.99,
            isActive: true,
          },
        ],
        skipDuplicates: true,
      });
    }

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