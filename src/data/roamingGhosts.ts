import { GhostProfile } from '../types/ghost';

export interface RoamingGhostConfig {
  id: string;
  name: string;
  scene: 'exterior' | 'dining' | 'graveyard';
  baseX: number; // percentage (0-100)
  baseY: number; // percentage (0-100)
  rangeX: number; // travel radius X percentage
  rangeY: number; // travel radius Y percentage
  speed: number;
  accessory: 'mj-fedora' | 'diana-frock' | 'napoleon-bicorne' | 'joan-helm' | 'vangogh-hat' | 'mozart-wig' | 'marilyn-dress' | 'frida-crown';
  motesType: 'music' | 'stars' | 'roses' | 'swirls' | 'sparks';
  profile: GhostProfile;
}

export const ROAMING_GHOSTS: RoamingGhostConfig[] = [
  // --- SCENE 1: CASTLE EXTERIOR ROAMING GHOSTS ---
  {
    id: 'roaming-michael-jackson',
    name: 'Michael Jackson',
    scene: 'exterior',
    baseX: 68,
    baseY: 28,
    rangeX: 14,
    rangeY: 8,
    speed: 0.85,
    accessory: 'mj-fedora',
    motesType: 'music',
    profile: {
      id: 'roaming-michael-jackson',
      name: 'Michael Jackson',
      nutshell: 'The King of Pop — visionary singer, songwriter, and transcendent dancer.',
      tale: 'A classic draped white sheet ghost wearing his iconic silver-trimmed tilted fedora, gliding backward through the moonlit clouds with phantom moonwalk steps, accompanied by drifting silver musical notes.',
      epitaph: 'In a world filled with hate, we must still dare to hope.',
      quote: 'Lies run sprints, but the truth runs marathons.',
      category: 'Music & Dance',
    },
  },
  {
    id: 'roaming-princess-diana',
    name: 'Princess Diana',
    scene: 'exterior',
    baseX: 26,
    baseY: 66,
    rangeX: 12,
    rangeY: 7,
    speed: 0.65,
    accessory: 'diana-frock',
    motesType: 'roses',
    profile: {
      id: 'roaming-princess-diana',
      name: 'Princess Diana',
      nutshell: 'The People’s Princess — champion of compassion, humanitarian relief, and grace.',
      tale: 'Drifting gently above the castle ruins draped in an elegant flowing silver frock and delicate crystal tiara, she brings warmth and quiet solace to the cold midnight mist.',
      epitaph: 'Carry out a random act of kindness, with no expectation of reward.',
      quote: 'I want to be a queen of people’s hearts, in people’s hearts.',
      category: 'Royalty & Humanitarian',
    },
  },
  {
    id: 'roaming-vincent-van-gogh',
    name: 'Vincent van Gogh',
    scene: 'exterior',
    baseX: 84,
    baseY: 55,
    rangeX: 10,
    rangeY: 9,
    speed: 0.75,
    accessory: 'vangogh-hat',
    motesType: 'swirls',
    profile: {
      id: 'roaming-vincent-van-gogh',
      name: 'Vincent van Gogh',
      nutshell: 'Post-Impressionist master painter who captured the swirling soul of the heavens.',
      tale: 'Floating near the full moon wearing his woven spectral straw hat, he watches the swirling clouds churn across the night sky, painting trails of silver starlight into the dark.',
      epitaph: 'I dream my painting and I paint my dream.',
      quote: 'For my part I know nothing with any certainty, but the sight of the stars makes me dream.',
      category: 'Fine Art & Painting',
    },
  },
  {
    id: 'roaming-mozart',
    name: 'Wolfgang Amadeus Mozart',
    scene: 'exterior',
    baseX: 42,
    baseY: 82,
    rangeX: 15,
    rangeY: 6,
    speed: 0.9,
    accessory: 'mozart-wig',
    motesType: 'music',
    profile: {
      id: 'roaming-mozart',
      name: 'Wolfgang Amadeus Mozart',
      nutshell: 'Prodigious classical composer whose symphonies and operas defined western music.',
      tale: 'A whimsical white sheet phantom crowned with an 18th-century powdered peruke wig, conducting silent concertos in the night breeze while clefs and staves float around his hem.',
      epitaph: 'The music is not in the notes, but in the silence between.',
      quote: 'Neither a lofty degree of intelligence nor imagination nor both together make genius. Love, love, love, that is the soul of genius.',
      category: 'Classical Music',
    },
  },

  // --- SCENE 3: GRAVEYARD ROAMING GHOSTS (Replacing old will-o-wisps) ---
  {
    id: 'roaming-joan-of-arc',
    name: 'Joan of Arc',
    scene: 'graveyard',
    baseX: 20,
    baseY: 52,
    rangeX: 12,
    rangeY: 8,
    speed: 0.7,
    accessory: 'joan-helm',
    motesType: 'sparks',
    profile: {
      id: 'roaming-joan-of-arc',
      name: 'Joan of Arc',
      nutshell: 'Patron saint of France, visionary warrior who led French forces during the Hundred Years’ War.',
      tale: 'A valiant white cloth spirit adorned with a polished silver knight’s helm and ethereal armor plate, keeping watch over the silent cemetery headstones with peaceful resolve.',
      epitaph: 'I am not afraid; I was born to do this.',
      quote: 'Act, and God will act; work, and He will work.',
      category: 'War & Valor',
    },
  },
  {
    id: 'roaming-napoleon',
    name: 'Napoleon Bonaparte',
    scene: 'graveyard',
    baseX: 62,
    baseY: 48,
    rangeX: 14,
    rangeY: 7,
    speed: 0.6,
    accessory: 'napoleon-bicorne',
    motesType: 'stars',
    profile: {
      id: 'roaming-napoleon',
      name: 'Napoleon Bonaparte',
      nutshell: 'French military commander, emperor, and master strategist who reshaped European history.',
      tale: 'A dignified cloth phantom wearing his iconic sideways black bicorne hat, inspecting the cemetery headstones as if drafting celestial maneuvers under the moonlight.',
      epitaph: 'Death is nothing, but to live defeated and inglorious is to die daily.',
      quote: 'History is a set of lies agreed upon.',
      category: 'War & Strategy',
    },
  },
  {
    id: 'roaming-marilyn-monroe',
    name: 'Marilyn Monroe',
    scene: 'graveyard',
    baseX: 42,
    baseY: 36,
    rangeX: 11,
    rangeY: 8,
    speed: 0.8,
    accessory: 'marilyn-dress',
    motesType: 'stars',
    profile: {
      id: 'roaming-marilyn-monroe',
      name: 'Marilyn Monroe',
      nutshell: 'Legendary Hollywood icon, actress, singer, and symbol of 20th-century allure.',
      tale: 'Gliding above the cemetery fog in a fluttering pleated white dress with soft silver sparkle motes, smiling warmly at wandering souls with timeless beauty.',
      epitaph: 'Imperfection is beauty, madness is genius.',
      quote: 'We are all of us stars, and we deserve to twinkle.',
      category: 'Cinema & Iconography',
    },
  },
  {
    id: 'roaming-frida-kahlo',
    name: 'Frida Kahlo',
    scene: 'graveyard',
    baseX: 84,
    baseY: 56,
    rangeX: 10,
    rangeY: 7,
    speed: 0.72,
    accessory: 'frida-crown',
    motesType: 'roses',
    profile: {
      id: 'roaming-frida-kahlo',
      name: 'Frida Kahlo',
      nutshell: 'Visionary Mexican painter celebrated for intense self-portraits, passion, and surrealism.',
      tale: 'A spirited white ghost crowned with a lush wreath of spectral silver roses, floating among the ancient twisted trees while sketching dreams onto the mist.',
      epitaph: 'Feet, what do I need you for when I have wings to fly?',
      quote: 'At the end of the day, we can endure much more than we think we can.',
      category: 'Art & Surrealism',
    },
  },
];
