import { GhostLook, GhostProfile } from '../types/ghost';

const L = (tint: string, aura: string, accessory: GhostLook['accessory'], held: GhostLook['held'] = 'none'): GhostLook => ({
  tint, aura, accessory, held,
});

// Per-ghost styling on top of the shared Phantom sprite.
export const LOOKS: Record<string, GhostLook> = {
  'albert-einstein': L('#8fa3c7', '#bfe3ff', 'wild-hair'),
  'cleopatra': L('#d8c27a', '#ffe9a8', 'crown'),
  'william-shakespeare': L('#6d5a8f', '#dcd0ff', 'beret', 'quill'),
  'marie-curie': L('#4a8ba3', '#8ff0dc', 'bun', 'flask'),
  'nikola-tesla': L('#5a79a8', '#8fe0ff', 'none'),
  'edgar-allan-poe': L('#3b3b4d', '#b8b8c8', 'hat'),
  'ada-lovelace': L('#8a63c9', '#c9b8ff', 'bow', 'book'),
  'leonardo-da-vinci': L('#9a6a48', '#ffe0a8', 'beret', 'brush'),
  'roaming-michael-jackson': L('#555a66', '#e6e9f0', 'mj-fedora'),
  'roaming-princess-diana': L('#c4d2e8', '#ffffff', 'diana-frock'),
  'roaming-vincent-van-gogh': L('#d1b04a', '#ffe08a', 'vangogh-hat', 'brush'),
  'roaming-mozart': L('#b7a3e0', '#e8defa', 'mozart-wig'),
  'roaming-joan-of-arc': L('#9aa7b8', '#dbe6f5', 'joan-helm'),
  'roaming-napoleon': L('#3d4d80', '#c8d2f0', 'napoleon-bicorne'),
  'roaming-marilyn-monroe': L('#f0d3df', '#ffffff', 'marilyn-dress'),
  'roaming-frida-kahlo': L('#c2306b', '#ffc4d8', 'frida-crown', 'flower'),
};

const PALETTE = ['#8fa3c7', '#a78bd0', '#6fb3b8', '#c98a8a', '#b9a46c', '#7e9bd1'];

export function getLook(g: Pick<GhostProfile, 'id' | 'name' | 'look'>): GhostLook {
  if (g.look) return g.look;
  if (LOOKS[g.id]) return LOOKS[g.id];
  let h = 0;
  for (const ch of g.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const c = PALETTE[h % PALETTE.length];
  return { tint: c, aura: '#dfe8ff', accessory: 'none', held: 'none' };
}
