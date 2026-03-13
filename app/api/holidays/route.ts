import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all holidays with their templates and programs
    const holidays = await prisma.holiday.findMany({
      include: {
        template: {
          select: {
            id: true,
            character: true,
            characterDescription: true,
            tone: true,
            headerImageKey: true,
            envelopeBackgroundKey: true,
            signatureImageKey: true,
            waxSealImageKey: true,
            emailHeaderImageKey: true,
          },
        },
        programs: {
          select: {
            id: true,
            name: true,
            tier: true,
            deliveryTypes: true,
            productTypes: true,
            priceDigital: true,
            pricePhysical: true,
            description: true,
            features: true,
            isActive: true,
          },
          orderBy: {
            tier: 'asc',
          },
        },
      },
      orderBy: {
        slug: 'asc',
      },
    });

    // Transform the data for the frontend
    const transformedHolidays = holidays.map(holiday => {
      // Determine status based on holiday slug and current date
      const now = new Date();
      const month = now.getMonth() + 1; // JavaScript months are 0-indexed

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

      return {
        id: holiday.id,
        slug: holiday.slug,
        name: holiday.name,
        description: holiday.description || '',
        status,
        statusLabel,
        theme: themeMap[holiday.slug] || 'theme-neutral',
        character: holiday.template?.character || 'Magical Character',
        characterDescription: holiday.template?.characterDescription || '',
        template: holiday.template,
        programs: holiday.programs.map(program => ({
          id: program.id,
          name: program.name,
          tier: program.tier,
          deliveryTypes: program.deliveryTypes,
          productTypes: program.productTypes,
          priceDigital: program.priceDigital,
          pricePhysical: program.pricePhysical,
          description: program.description,
          features: program.features,
          isActive: program.isActive,
        })),
      };
    });

    return NextResponse.json(transformedHolidays);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holidays' },
      { status: 500 }
    );
  }
}