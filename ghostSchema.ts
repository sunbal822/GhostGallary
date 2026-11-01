import { z } from "zod";

// Fixed vocabulary: the model may only pick from these, so the SVG renderer
// always has an asset to draw. Add a value here AND an SVG part for it.
export const OUTFITS = ["sweater", "dress", "suit", "coat", "robe", "tshirt", "uniform", "apron", "jacket", "gown", "shawl", "traditional"] as const;
export const PATTERNS = ["solid", "striped", "knit", "checkered", "floral"] as const;
export const HAIR_STYLES = ["bun", "short", "long", "curly", "afro", "wavy", "ponytail", "slicked", "bald"] as const;
export const HAIR_COLORS = ["black", "brown", "grey", "white", "blonde", "red"] as const;
export const ITEMS = ["none", "pie", "yarn", "book", "guitar", "microphone", "paintbrush", "lantern", "flower", "teacup", "tool", "camera", "ball", "telescope", "sheet_music"] as const;
export const ACCESSORIES = ["none", "glasses", "hat", "crown", "scarf", "necklace", "bowtie", "headscarf", "gloves"] as const;
export const MOVEMENTS = ["drift", "dance", "pace", "spin", "hop", "sway", "patrol"] as const;

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const GhostProfileSchema = z.object({
  name: z.string().min(1).max(80),
  outfit: z.enum(OUTFITS),
  outfitPattern: z.enum(PATTERNS),
  outfitColor: hex,
  hairStyle: z.enum(HAIR_STYLES),
  hairColor: z.enum(HAIR_COLORS),
  heldItem: z.enum(ITEMS),
  accessory: z.enum(ACCESSORIES),
  auraColor: hex,
  movement: z.enum(MOVEMENTS),
  nutshell: z.string().min(1).max(400),
  tale: z.string().min(1).max(900),
  epitaph: z.string().min(1).max(160),
  chatPersona: z.string().min(1).max(900),
});

export type GhostProfile = z.infer<typeof GhostProfileSchema>;

export const DEFAULTS: GhostProfile = {
  name: "Unknown Spirit",
  outfit: "robe",
  outfitPattern: "solid",
  outfitColor: "#8a8fb5",
  hairStyle: "short",
  hairColor: "grey",
  heldItem: "none",
  accessory: "none",
  auraColor: "#cfd8ff",
  movement: "drift",
  nutshell: "A quiet spirit with a story still being told.",
  tale: "They drift through the gallery at night, humming something half remembered.",
  epitaph: "Remembered.",
  chatPersona: "A gentle, friendly ghost who speaks warmly and briefly.",
};

const ENUM_FIELDS: Record<string, readonly string[]> = {
  outfit: OUTFITS,
  outfitPattern: PATTERNS,
  hairStyle: HAIR_STYLES,
  hairColor: HAIR_COLORS,
  heldItem: ITEMS,
  accessory: ACCESSORIES,
  movement: MOVEMENTS,
};

const TEXT_MAX: Record<string, number> = { name: 80, nutshell: 400, tale: 900, epitaph: 160, chatPersona: 900 };

function stripFences(raw: string): string {
  const m = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = m ? m[1] : raw;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  return start >= 0 && end > start ? body.slice(start, end + 1) : body;
}

/** Strict parse. Throws if the model output is not valid. */
export function parseProfileStrict(raw: string): GhostProfile {
  return GhostProfileSchema.parse(JSON.parse(stripFences(raw)));
}

/** Lenient parse: any invalid or missing field falls back to a default. */
export function parseProfileLenient(raw: string, fallbackName: string): GhostProfile {
  let obj: Record<string, unknown> = {};
  try {
    obj = JSON.parse(stripFences(raw));
  } catch {
    /* keep empty, defaults fill everything */
  }
  const out: Record<string, unknown> = { ...DEFAULTS, name: fallbackName };
  for (const key of Object.keys(DEFAULTS) as (keyof GhostProfile)[]) {
    const v = obj[key];
    if (v === undefined || v === null) continue;
    if (ENUM_FIELDS[key]) {
      if (typeof v === "string" && ENUM_FIELDS[key].includes(v)) out[key] = v;
    } else if (key === "outfitColor" || key === "auraColor") {
      if (typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v)) out[key] = v;
    } else if (typeof v === "string" && v.trim()) {
      const max = TEXT_MAX[key] ?? 900;
      out[key] = v.trim().slice(0, max);
    }
  }
  return GhostProfileSchema.parse(out);
}
