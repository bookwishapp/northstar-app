import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Extract holiday data from the request
    const { name, slug, displayOrder, orderDeadlineLabel, isActive } = data;

    // Check if a template with this holidaySlug already exists
    const existingTemplate = await prisma.template.findFirst({
      where: { holidaySlug: slug }
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'A holiday with this slug already exists' },
        { status: 400 }
      );
    }

    // Create a new Template for this holiday
    // According to Architecture Addendum: "When a new holiday is created,
    // seed it with a blank template (null graphic keys, default colors/margins,
    // placeholder prompt text that says "CONFIGURE THIS PROMPT BEFORE GOING LIVE")"
    const template = await prisma.template.create({
      data: {
        holidaySlug: slug,
        name: name,
        character: name, // Use holiday name as initial character name
        location: 'North Pole', // Default location
        isActive: isActive,

        // Visual config - null graphic keys as specified
        backgroundKey: null,
        headerKey: null,
        characterKey: null,
        waxSealKey: null,
        signatureKey: null,

        // Typography - defaults
        fontFamily: 'Special Elite',
        fontUrl: 'https://fonts.googleapis.com/css2?family=Special+Elite&display=swap',
        primaryColor: '#2c1810',
        accentColor: '#8b0000',

        // Layout - defaults
        paperSize: 'letter',
        marginTop: '1.2in',
        marginBottom: '1in',
        marginLeft: '0.9in',
        marginRight: '0.9in',

        // Multi-page behavior - defaults
        repeatBackground: true,
        headerFirstPageOnly: true,
        waxSealLastPageOnly: true,

        // AI prompt config - placeholder text as specified
        characterTone: 'warm, friendly, magical',
        letterPrompt: 'CONFIGURE THIS PROMPT BEFORE GOING LIVE\n\nThis is a placeholder prompt for letter generation. Please update this with the actual prompt for generating personalized letters from ' + name + '.',
        storyPrompt: 'CONFIGURE THIS PROMPT BEFORE GOING LIVE\n\nThis is a placeholder prompt for story generation. Please update this with the actual prompt for generating personalized stories featuring ' + name + '.',
      },
    });

    return NextResponse.json({
      success: true,
      slug: template.holidaySlug,
      templateId: template.id,
      message: `Holiday "${name}" created successfully with template`
    });

  } catch (error) {
    console.error('Failed to create holiday:', error);
    return NextResponse.json(
      { error: 'Failed to create holiday' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get all unique holidays by finding all templates and grouping by holidaySlug
    const templates = await prisma.template.findMany({
      include: {
        programs: {
          include: {
            _count: {
              select: { orders: true },
            },
          },
        },
      },
      orderBy: { holidaySlug: 'asc' },
    });

    // Group templates by holidaySlug to get unique holidays
    const holidaysMap = new Map();

    templates.forEach(template => {
      if (!holidaysMap.has(template.holidaySlug)) {
        holidaysMap.set(template.holidaySlug, {
          slug: template.holidaySlug,
          name: template.name,
          isActive: template.isActive,
          templates: [],
          programCount: 0,
          orderCount: 0,
        });
      }

      const holiday = holidaysMap.get(template.holidaySlug);
      holiday.templates.push(template);
      holiday.programCount += template.programs.length;
      holiday.orderCount += template.programs.reduce((sum, p) => sum + p._count.orders, 0);

      // Use the active status of any active template for the holiday
      if (template.isActive) {
        holiday.isActive = true;
      }
    });

    const holidays = Array.from(holidaysMap.values());

    return NextResponse.json(holidays);
  } catch (error) {
    console.error('Failed to fetch holidays:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holidays' },
      { status: 500 }
    );
  }
}