import HomePage from '@/components/HomePage';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering since database is not available at build time on Railway
export const dynamic = 'force-dynamic';

// Helper to get current active holiday based on date
function getCurrentHoliday(holidays: any[]) {
  const now = new Date();
  const month = now.getMonth() + 1;

  // Priority order for seasonal holidays (display starts month before)
  if (month >= 11 && month <= 12) {
    return holidays.find(h => h.slug === 'christmas');
  } else if (month >= 9 && month <= 10) {
    return holidays.find(h => h.slug === 'halloween');
  } else if (month === 1 || month === 2) {
    return holidays.find(h => h.slug === 'valentine');
  } else if (month >= 3 && month <= 4) {
    return holidays.find(h => h.slug === 'easter');
  }

  // Default to birthday if no seasonal holiday
  return holidays.find(h => h.slug === 'birthday') || holidays[0];
}

async function getHolidays() {
  try {
    const holidays = await prisma.holiday.findMany({
      include: {
        template: {
          select: {
            character: true,
            characterTone: true,
          },
        },
      },
      orderBy: {
        slug: 'asc',
      },
    });

    // Transform the data
    const transformedHolidays = holidays.map(holiday => {
      const now = new Date();
      const month = now.getMonth() + 1;

      let status: 'active' | 'soon' | 'always' | 'inactive' = 'soon';
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

      // Override with isActive flag
      if (!holiday.isActive) {
        status = 'inactive';
        statusLabel = 'Currently Unavailable';
      }

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
        characterDescription: holiday.template?.characterTone || '',
      };
    });

    return transformedHolidays;
  } catch (error) {
    console.error('Error fetching holidays:', error);
    // Return default holidays if database fetch fails
    return [
      {
        id: '1',
        slug: 'easter',
        name: 'Easter',
        character: 'The Easter Bunny',
        theme: 'theme-easter',
        description: 'A personal letter from the Easter Bunny, with an enchanted story written just for them.',
        status: 'active' as const,
        statusLabel: 'Orders Open',
        characterDescription: '',
      },
      {
        id: '2',
        slug: 'christmas',
        name: 'Christmas',
        character: 'Santa Claus',
        theme: 'theme-christmas',
        description: 'A letter from Santa himself, brimming with holiday wonder and personal details.',
        status: 'soon' as const,
        statusLabel: 'Opens Dec 1',
        characterDescription: '',
      },
      {
        id: '3',
        slug: 'birthday',
        name: 'Birthday',
        character: 'Birthday Wizard',
        theme: 'theme-birthday',
        description: 'A magical birthday letter that makes them feel like the star of their own story.',
        status: 'always' as const,
        statusLabel: 'Year-Round',
        characterDescription: '',
      },
      {
        id: '4',
        slug: 'halloween',
        name: 'Halloween',
        character: 'The Ghost',
        theme: 'theme-halloween',
        description: 'A delightfully spooky letter from a mysterious character just beyond the veil.',
        status: 'soon' as const,
        statusLabel: 'Opens Oct 1',
        characterDescription: '',
      },
      {
        id: '5',
        slug: 'tooth-fairy',
        name: 'Tooth Fairy',
        character: 'The Tooth Fairy',
        theme: 'theme-tooth',
        description: 'Mark a tiny milestone with a letter from the Tooth Fairy, delivered right on cue.',
        status: 'always' as const,
        statusLabel: 'Year-Round',
        characterDescription: '',
      },
      {
        id: '6',
        slug: 'valentine',
        name: "Valentine's Day",
        character: 'Cupid',
        theme: 'theme-valentine',
        description: 'A heartfelt letter that lets them know just how cherished and wonderful they are.',
        status: 'soon' as const,
        statusLabel: 'Opens Feb 1',
        characterDescription: '',
      }
    ];
  }
}

export default async function Page() {
  const holidays = await getHolidays();
  const currentHoliday = getCurrentHoliday(holidays);

  return <HomePage holidays={holidays} currentHoliday={currentHoliday} />;
}