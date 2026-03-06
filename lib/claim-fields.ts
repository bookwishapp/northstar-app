export interface Field {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: string[]; // for select type
}

export const claimFields: Record<string, Field[]> = {
  christmas: [
    {
      key: 'accomplishment',
      label: "What's their biggest accomplishment this year?",
      type: 'textarea',
      placeholder: 'Learning to ride a bike, making new friends, getting good grades...',
      required: true
    },
    {
      key: 'interest',
      label: "What are they most interested in right now?",
      type: 'text',
      placeholder: 'Dinosaurs, space, art, sports...',
      required: true
    },
    {
      key: 'behavior',
      label: "Have they been good this year?",
      type: 'select',
      options: ['Very good', 'Mostly good', 'Trying their best'],
      required: true
    },
    {
      key: 'sibling',
      label: "Any siblings or pets to mention?",
      type: 'text',
      placeholder: 'Optional - leave blank if none'
    },
    {
      key: 'special_message',
      label: "Any special message from Santa?",
      type: 'textarea',
      placeholder: 'Optional - something specific you want Santa to mention'
    }
  ],

  easter: [
    {
      key: 'favorite_activity',
      label: "What's their favorite spring activity?",
      type: 'text',
      placeholder: 'Playing outside, hunting for eggs, gardening...',
      required: true
    },
    {
      key: 'favorite_treat',
      label: "What's their favorite Easter treat?",
      type: 'text',
      placeholder: 'Chocolate eggs, jelly beans, marshmallow peeps...',
      required: true
    },
    {
      key: 'pet_name',
      label: "Do they have a pet? What's its name?",
      type: 'text',
      placeholder: 'Optional - leave blank if no pets'
    },
    {
      key: 'kindness',
      label: "A recent act of kindness they've done?",
      type: 'textarea',
      placeholder: 'Helping a friend, sharing toys, being kind to animals...'
    }
  ],

  birthday: [
    {
      key: 'turning_age',
      label: "How old are they turning?",
      type: 'number',
      required: true
    },
    {
      key: 'party_theme',
      label: "Birthday party theme or favorite thing?",
      type: 'text',
      placeholder: 'Superheroes, princesses, dinosaurs, sports...',
      required: true
    },
    {
      key: 'favorite_activity',
      label: "What do they love doing?",
      type: 'text',
      placeholder: 'Drawing, playing games, reading, building...',
      required: true
    },
    {
      key: 'birthday_wish',
      label: "What's their birthday wish?",
      type: 'textarea',
      placeholder: 'What are they hoping for on their special day?'
    },
    {
      key: 'best_friend',
      label: "Best friend's name?",
      type: 'text',
      placeholder: 'Optional - for a special mention'
    }
  ],

  valentine: [
    {
      key: 'favorite_person',
      label: "Who is their favorite person to spend time with?",
      type: 'text',
      required: true
    },
    {
      key: 'kind_deed',
      label: "Something kind they did recently?",
      type: 'textarea',
      placeholder: 'Sharing, helping, being a good friend...',
      required: true
    },
    {
      key: 'favorite_activity',
      label: "Favorite thing to do with friends or family?",
      type: 'text',
      placeholder: 'Playing games, reading stories, going to the park...'
    }
  ],

  halloween: [
    {
      key: 'costume',
      label: "What are they dressing up as this Halloween?",
      type: 'text',
      required: true
    },
    {
      key: 'favorite_candy',
      label: "What's their favorite Halloween candy?",
      type: 'text',
      required: true
    },
    {
      key: 'brave_moment',
      label: "Something brave they've done recently?",
      type: 'textarea',
      placeholder: 'Trying something new, overcoming a fear...'
    },
    {
      key: 'spooky_fun',
      label: "Do they like spooky things or prefer fun Halloween?",
      type: 'select',
      options: ['Loves spooky', 'Prefers fun and silly', 'A little of both']
    }
  ],

  stpatricks: [
    {
      key: 'lucky_charm',
      label: "What makes them feel lucky?",
      type: 'text',
      required: true
    },
    {
      key: 'favorite_green',
      label: "Favorite green thing?",
      type: 'text',
      placeholder: 'Green shirt, grass, trees, vegetables...',
      required: true
    },
    {
      key: 'irish_heritage',
      label: "Any Irish heritage or traditions?",
      type: 'text',
      placeholder: 'Optional - family traditions or heritage'
    },
    {
      key: 'rainbow_wish',
      label: "If they found a pot of gold, what would they wish for?",
      type: 'textarea'
    }
  ]
};

// Helper to get display name for holiday
export function getHolidayDisplayName(slug: string): string {
  const names: Record<string, string> = {
    christmas: 'Christmas',
    easter: 'Easter',
    birthday: 'Birthday',
    valentine: "Valentine's Day",
    halloween: 'Halloween',
    stpatricks: "St. Patrick's Day"
  };
  return names[slug] || slug;
}