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
      key: 'favoriteSpringActivity',
      label: "What's their favorite thing about spring?",
      placeholder: "Playing outside, looking for bugs, riding their bike...",
      type: 'text',
      required: true,
    },
    {
      key: 'bigAccomplishment',
      label: "What's something great they've done recently?",
      placeholder: "Learned to read, made a new friend, helped someone...",
      type: 'text',
      required: true,
    },
    {
      key: 'currentInterest',
      label: "What are they really into right now?",
      placeholder: "Dinosaurs, Minecraft, gymnastics, drawing...",
      type: 'text',
      required: true,
    },
    {
      key: 'petOrSibling',
      label: "Any pets or siblings the Easter Bunny should mention?",
      placeholder: "Dog named Max, little sister Lily... (optional)",
      type: 'text',
      required: false,
    },
    {
      key: 'favoriteColor',
      label: "What's their favorite color?",
      placeholder: "Purple, rainbow, blue...",
      type: 'text',
      required: false,
    },
  ],

  birthday: [
    {
      key: 'newAge',
      label: "What age are they turning?",
      placeholder: "5, 6, 7...",
      type: 'text',
      required: true,
    },
    {
      key: 'accomplishments',
      label: "What are they proud of from this past year?",
      placeholder: "Learned to ride a bike, made the soccer team, read 50 books...",
      type: 'textarea',
      required: true,
    },
    {
      key: 'currentInterests',
      label: "What are they really into right now?",
      placeholder: "Pokemon, gymnastics, Lego, drawing...",
      type: 'text',
      required: true,
    },
    {
      key: 'birthdayWish',
      label: "What's their big birthday wish?",
      placeholder: "A puppy, to learn guitar, to visit Disneyland...",
      type: 'text',
      required: false,
    },
    {
      key: 'specialQualities',
      label: "What makes them special?",
      placeholder: "Kind to everyone, creative, funny, brave...",
      type: 'textarea',
      required: false,
    },
  ],

  valentine: [
    {
      key: 'kindActions',
      label: "How have they shown kindness recently?",
      placeholder: "Helped a friend, shared their toys, made someone smile...",
      type: 'textarea',
      required: true,
    },
    {
      key: 'bestFriends',
      label: "Who are their best friends?",
      placeholder: "Sarah from school, cousin Jake, neighbor Emma...",
      type: 'text',
      required: true,
    },
    {
      key: 'showsLove',
      label: "How do they show love to family?",
      placeholder: "Hugs, helping with chores, drawing pictures...",
      type: 'text',
      required: true,
    },
    {
      key: 'favoriteActivities',
      label: "What do they love doing?",
      placeholder: "Reading, playing soccer, building with Lego...",
      type: 'text',
      required: false,
    },
    {
      key: 'pets',
      label: "Any pets they love?",
      placeholder: "Dog named Max, cat named Whiskers... (optional)",
      type: 'text',
      required: false,
    },
  ],

  halloween: [
    {
      key: 'costume',
      label: "What's their Halloween costume this year?",
      placeholder: "Astronaut, princess, dinosaur, superhero...",
      type: 'text',
      required: true,
    },
    {
      key: 'favoriteCandy',
      label: "What's their favorite Halloween candy?",
      placeholder: "Chocolate bars, gummy bears, lollipops...",
      type: 'text',
      required: true,
    },
    {
      key: 'halloweenActivity',
      label: "What Halloween activity do they love?",
      placeholder: "Carving pumpkins, trick-or-treating, decorating...",
      type: 'text',
      required: true,
    },
    {
      key: 'braveMoment',
      label: "When have they been brave recently?",
      placeholder: "Tried something new, stood up for a friend...",
      type: 'textarea',
      required: false,
    },
    {
      key: 'bestFriend',
      label: "Who are they trick-or-treating with?",
      placeholder: "Best friend Emma, siblings, cousins... (optional)",
      type: 'text',
      required: false,
    },
  ],

  stpatricks: [
    {
      key: 'luckyMoment',
      label: "What's a lucky or special moment they had this year?",
      placeholder: "Won a contest, made a new friend, found something special...",
      type: 'textarea',
      required: true,
    },
    {
      key: 'specialTalent',
      label: "What's their special talent or skill?",
      placeholder: "Great at sports, tells funny jokes, amazing artist...",
      type: 'text',
      required: true,
    },
    {
      key: 'makesThemLucky',
      label: "What makes them feel lucky?",
      placeholder: "Their family, their pet, their friends...",
      type: 'text',
      required: true,
    },
    {
      key: 'favoriteGreenThing',
      label: "What's their favorite green thing?",
      placeholder: "Green apples, grass, their green bike... (optional)",
      type: 'text',
      required: false,
    },
    {
      key: 'wishForLuck',
      label: "What would they wish for if they found a pot of gold?",
      placeholder: "A treehouse, world peace, a puppy... (optional)",
      type: 'text',
      required: false,
    },
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