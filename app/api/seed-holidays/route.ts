import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'seed-holidays-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if holidays already exist
    const existingCount = await prisma.holiday.count();
    if (existingCount > 0) {
      return NextResponse.json({
        message: 'Holidays already exist',
        count: existingCount
      });
    }

    // Create all holidays
    const holidays = await prisma.holiday.createMany({
      data: [
        {
          slug: 'easter',
          name: 'Easter',
          description: 'Letters from the Easter Bunny filled with springtime magic',
          isActive: true
        },
        {
          slug: 'christmas',
          name: 'Christmas',
          description: 'Personalized letters from Santa at the North Pole',
          isActive: true
        },
        {
          slug: 'halloween',
          name: 'Halloween',
          description: 'Spooky messages from friendly Halloween characters',
          isActive: true
        },
        {
          slug: 'tooth-fairy',
          name: 'Tooth Fairy',
          description: 'Magical notes celebrating lost teeth milestones',
          isActive: true
        },
        {
          slug: 'birthday',
          name: 'Birthday',
          description: 'Special birthday wishes from magical friends',
          isActive: true
        },
        {
          slug: 'valentine',
          name: "Valentine's Day",
          description: 'Heartfelt messages of friendship and love',
          isActive: true
        }
      ]
    });

    // Verify creation
    const finalCount = await prisma.holiday.count();
    const allHolidays = await prisma.holiday.findMany({
      select: { slug: true, name: true, isActive: true }
    });

    return NextResponse.json({
      success: true,
      message: 'Holidays seeded successfully',
      created: holidays.count,
      totalCount: finalCount,
      holidays: allHolidays
    });
  } catch (error) {
    console.error('Seed holidays error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}