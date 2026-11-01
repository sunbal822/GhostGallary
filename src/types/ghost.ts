export type AccessoryId =
  | 'none' | 'mj-fedora' | 'diana-frock' | 'napoleon-bicorne' | 'joan-helm' | 'vangogh-hat'
  | 'mozart-wig' | 'marilyn-dress' | 'frida-crown' | 'crown' | 'wild-hair' | 'bun' | 'beret'
  | 'bow' | 'glasses' | 'hat' | 'flowers' | 'curls';

export type HeldId = 'none' | 'pie' | 'book' | 'flask' | 'quill' | 'brush' | 'flower' | 'mug';

export interface GhostLook {
  tint: string; // outfit colour, hex #rrggbb
  aura: string; // glow colour, hex #rrggbb
  accessory: AccessoryId;
  held: HeldId;
}

export interface GhostProfile {
  id: string;
  name: string;
  nutshell: string;
  tale: string;
  epitaph: string;
  category?: string;
  quote?: string;
  avatarSvg?: string;
  isCustom?: boolean;
  isPrivate?: boolean;
  look?: GhostLook;
  figure?: string; // ghosted cut-out of their photo (transparent PNG data URL)
  portrait?: string; // raw photo handed to the browser once, to be turned into the figure
  portraitUrl?: string; // where that photo lives, so the browser can fetch it itself if the server couldn't
  isSummoned?: boolean;
  story?: string; // what the visitor told us about a personal ghost
}

export type SceneId = 'exterior' | 'dining' | 'graveyard';

export interface BanquetDialogue {
  id: string;
  speakers: [string, string];
  topic: string;
  dialogue: { speaker: string; text: string }[];
}

export interface GraveyardMemorial {
  id: string;
  x: number; // percentage left on graveyard plate
  y: number; // percentage top
  width: number; // percentage width matching stone
  height: number; // percentage height matching stone
  title: string;
  era: string;
  epitaph: string;
  reflection: string;
  hasOfferedRose?: boolean;
}
