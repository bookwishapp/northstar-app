import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await context.params;
    const { slug } = params;

    // Fetch the specific holiday with its template and programs
    const holiday = await prisma.holiday.findUnique({
      where: {
        slug,
      },
      include: {
        template: true,
        programs: {
          where: {
            isActive: true,
          },
          orderBy: {
            tier: 'asc',
          },
        },
      },
    });

    if (!holiday) {
      return NextResponse.json(
        { error: 'Holiday not found' },
        { status: 404 }
      );
    }

    // Determine status based on holiday slug and current date
    const now = new Date();
    const month = now.getMonth() + 1;

    let status = 'soon';
    let statusLabel = 'Coming Soon';

    // Birthday and Tooth Fairy are always available
    if (holiday.slug === 'birthday' || holiday.slug === 'tooth-fairy') {
      status = 'always';
      statusLabel = 'Year-Round';
    }
    // Easter (March-April)
    else if (holiday.slug === 'easter') {
      if (month >= 3 && month <= 4) {
        status = 'active';
        statusLabel = 'Orders Open';
      } else {
        statusLabel = 'Opens March 1';
      }
    }
    // Christmas (December)
    else if (holiday.slug === 'christmas') {
      if (month === 12) {
        status = 'active';
        statusLabel = 'Orders Open';
      } else {
        statusLabel = 'Opens Dec 1';
      }
    }
    // Halloween (October)
    else if (holiday.slug === 'halloween') {
      if (month === 10) {
        status = 'active';
        statusLabel = 'Orders Open';
      } else {
        statusLabel = 'Opens Oct 1';
      }
    }
    // Valentine's Day (February)
    else if (holiday.slug === 'valentine') {
      if (month === 2) {
        status = 'active';
        statusLabel = 'Orders Open';
      } else {
        statusLabel = 'Opens Feb 1';
      }
    }

    // Override with isActive flag if holiday is manually disabled
    if (!holiday.isActive) {
      status = 'inactive';
      statusLabel = 'Currently Unavailable';
    }

    // Get theme class based on slug
    const themeMap: Record<string, string> = {
      easter: 'theme-easter',
      christmas: 'theme-christmas',
      birthday: 'theme-birthday',
      halloween: 'theme-halloween',
      'tooth-fairy': 'theme-tooth',
      valentine: 'theme-valentine',
    };

    // Transform program data to include formatted prices
    const transformedPrograms = holiday.programs.map(program => {
      const features = program.features || [];

      // Add default features based on tier
      const defaultFeatures: Record<string, string[]> = {
        basic: [
          'Personalized letter from character',
          'Child\'s name & age included',
          'Digital delivery (PDF)',
          'Beautiful holiday design',
        ],
        premium: [
          'Everything in Basic',
          'Extended personalization',
          'Special achievements mentioned',
          'Gift suggestions included',
          'Priority processing',
        ],
        deluxe: [
          'Everything in Premium',
          'Magical story included',
          'Multiple format options',
          'Physical mail option',
          'Express delivery available',
        ],
      };

      return {
        id: program.id,
        name: program.name,
        tier: program.tier,
        deliveryTypes: program.deliveryTypes,
        productTypes: program.productTypes,
        priceDigital: program.priceDigital,
        pricePhysical: program.pricePhysical,
        description: program.description,
        features: features.length > 0 ? features : (defaultFeatures[program.tier] || []),
        isActive: program.isActive,
        popular: program.tier === 'premium', // Mark premium as popular
      };
    });

    const response = {
      id: holiday.id,
      slug: holiday.slug,
      name: holiday.name,
      description: holiday.description || '',
      status,
      statusLabel,
      theme: themeMap[holiday.slug] || 'theme-neutral',
      isActive: holiday.isActive,
      character: holiday.template?.character || 'Magical Character',
      characterDescription: holiday.template?.characterDescription || '',
      template: {
        id: holiday.template?.id,
        character: holiday.template?.character,
        characterDescription: holiday.template?.characterDescription,
        tone: holiday.template?.tone,
        headerImageKey: holiday.template?.headerImageKey,
        envelopeBackgroundKey: holiday.template?.envelopeBackgroundKey,
        signatureImageKey: holiday.template?.signatureImageKey,
        waxSealImageKey: holiday.template?.waxSealImageKey,
        emailHeaderImageKey: holiday.template?.emailHeaderImageKey,
      },
      programs: transformedPrograms,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching holiday:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holiday' },
      { status: 500 }
    );
  }
}