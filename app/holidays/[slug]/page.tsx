import { notFound } from 'next/navigation';
import HolidayPageComponent from '@/components/HolidayPage';
import prisma from '@/lib/prisma';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getHoliday(slug: string) {
  try {
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
      return null;
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

    return {
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
      programs: transformedPrograms,
    };
  } catch (error) {
    console.error('Error fetching holiday:', error);

    // Fallback data when database is unavailable
    const fallbackHolidays: Record<string, any> = {
      easter: {
        id: '1',
        slug: 'easter',
        name: 'Easter',
        description: 'A personal letter from the Easter Bunny, with an enchanted story written just for them.',
        status: 'active',
        statusLabel: 'Orders Open',
        theme: 'theme-easter',
        isActive: true,
        character: 'The Easter Bunny',
        characterDescription: 'A magical bunny who brings joy and chocolate eggs',
        programs: [
          {
            id: '1',
            name: 'Basic Easter Letter',
            tier: 'basic',
            deliveryTypes: ['digital'],
            productTypes: ['letter'],
            priceDigital: 1200,
            pricePhysical: null,
            description: 'A personalized letter from the Easter Bunny',
            features: [
              'Personalized letter from the Easter Bunny',
              "Child's name & age included",
              'Digital delivery (PDF)',
              'Beautiful Easter design',
            ],
            isActive: true,
            popular: false,
          },
          {
            id: '2',
            name: 'Premium Easter Package',
            tier: 'premium',
            deliveryTypes: ['digital'],
            productTypes: ['letter', 'story'],
            priceDigital: 1800,
            pricePhysical: null,
            description: 'Letter plus a magical Easter story',
            features: [
              'Everything in Basic',
              'Extended personalization',
              'Special achievements mentioned',
              'Gift suggestions included',
              'Priority processing',
            ],
            isActive: true,
            popular: true,
          },
        ],
      },
      christmas: {
        id: '2',
        slug: 'christmas',
        name: 'Christmas',
        description: 'A letter from Santa himself, brimming with holiday wonder and personal details.',
        status: 'soon',
        statusLabel: 'Opens Dec 1',
        theme: 'theme-christmas',
        isActive: true,
        character: 'Santa Claus',
        characterDescription: 'The jolly man from the North Pole',
        programs: [],
      },
      birthday: {
        id: '3',
        slug: 'birthday',
        name: 'Birthday',
        description: 'A magical birthday letter that makes them feel like the star of their own story.',
        status: 'always',
        statusLabel: 'Year-Round',
        theme: 'theme-birthday',
        isActive: true,
        character: 'Birthday Wizard',
        characterDescription: 'A magical wizard who celebrates your special day',
        programs: [],
      },
      halloween: {
        id: '4',
        slug: 'halloween',
        name: 'Halloween',
        description: 'A delightfully spooky letter from a mysterious character just beyond the veil.',
        status: 'soon',
        statusLabel: 'Opens Oct 1',
        theme: 'theme-halloween',
        isActive: true,
        character: 'The Ghost',
        characterDescription: 'A friendly ghost with spooky stories',
        programs: [],
      },
      'tooth-fairy': {
        id: '5',
        slug: 'tooth-fairy',
        name: 'Tooth Fairy',
        description: 'Mark a tiny milestone with a letter from the Tooth Fairy, delivered right on cue.',
        status: 'always',
        statusLabel: 'Year-Round',
        theme: 'theme-tooth',
        isActive: true,
        character: 'The Tooth Fairy',
        characterDescription: 'The magical fairy who collects teeth',
        programs: [],
      },
      valentine: {
        id: '6',
        slug: 'valentine',
        name: "Valentine's Day",
        description: 'A heartfelt letter that lets them know just how cherished and wonderful they are.',
        status: 'soon',
        statusLabel: 'Opens Feb 1',
        theme: 'theme-valentine',
        isActive: true,
        character: 'Cupid',
        characterDescription: 'The angel of love and friendship',
        programs: [],
      },
    };

    return fallbackHolidays[slug] || null;
  }
}

// Generate static params for all holidays
export async function generateStaticParams() {
  try {
    const holidays = await prisma.holiday.findMany({
      select: {
        slug: true,
      },
    });

    return holidays.map((holiday) => ({
      slug: holiday.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    // Return default holiday slugs when database is unavailable
    return [
      { slug: 'easter' },
      { slug: 'christmas' },
      { slug: 'birthday' },
      { slug: 'halloween' },
      { slug: 'tooth-fairy' },
      { slug: 'valentine' },
    ];
  }
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const holiday = await getHoliday(resolvedParams.slug);

  if (!holiday) {
    notFound();
  }

  return <HolidayPageComponent holiday={holiday} />;
}