import { OUTFITS, PATTERNS, HAIR_STYLES, HAIR_COLORS, ITEMS, ACCESSORIES, MOVEMENTS, GhostProfile } from "./ghostSchema";

export type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
export type Message = { role: "system" | "user" | "assistant"; content: string | Part[] };

const list = (a: readonly string[]) => a.join(" | ");

const SYSTEM = `You turn a person's description into a friendly cartoon ghost profile for a memorial-style gallery.
Reply with ONE JSON object and nothing else (no markdown, no commentary).

Allowed values (use EXACTLY these strings):
outfit: ${list(OUTFITS)}
outfitPattern: ${list(PATTERNS)}
hairStyle: ${list(HAIR_STYLES)}
hairColor: ${list(HAIR_COLORS)}
heldItem: ${list(ITEMS)}
accessory: ${list(ACCESSORIES)}
movement: ${list(MOVEMENTS)}
outfitColor, auraColor: hex colors like "#b3202a"

JSON keys: name, outfit, outfitPattern, outfitColor, hairStyle, hairColor, heldItem, accessory, auraColor, movement, nutshell, tale, epitaph, chatPersona

Text fields:
- nutshell: 2 sentences, who they were.
- tale: about 80 words, a short playful story of how this ghost spends the afterlife, in character with their real life.
- epitaph: one line, under 15 words.
- chatPersona: 2-3 sentences describing how this ghost talks (tone, favorite topics, habits), written as instructions to an actor.

Rules:
- Use ONLY the facts you are given. Never invent biographical facts. Invented details belong only in the playful afterlife tale, and must be gentle.
- Be warm and affectionate. No jokes about how the person died, no cruelty, nothing about contested controversies.
- Pick heldItem and accessory that match something real in the facts (a food, hobby, tool, or signature item). Use "none" if nothing fits.
- movement: choose from what they were known for or how they are described (musician: dance, scientist or thinker: pace, calm or gentle: drift or sway, energetic: hop or spin, guardian or worker: patrol).
- If unsure about a visual detail, choose a neutral value. Do not guess faces or ethnicity; only clothing, hair, items, mood.`;

export function famousMessages(name: string, facts: string): Message[] {
  return [
    { role: "system", content: SYSTEM },
    { role: "user", content: `Make a ghost of ${name}.\n\nFacts (from Wikipedia, use only these):\n${facts.slice(0, 2500)}` },
  ];
}

export function storyMessages(name: string, story: string): Message[] {
  return [
    { role: "system", content: SYSTEM },
    { role: "user", content: `Make a ghost of ${name}, a loved one. Use only what the writer says below.\n\nStory:\n${story.slice(0, 3000)}` },
  ];
}

/** imageDataUrl: "data:image/jpeg;base64,...". Resize client-side to ~768px first. */
export function photoMessages(name: string, imageDataUrl: string, story?: string): Message[] {
  const text =
    `Make a ghost of ${name}, a loved one. Look at the photo and describe ONLY clothing (type, color, pattern), hair (style, color), ` +
    `accessories and any held object. Do not describe the face.` +
    (story ? `\n\nThe writer also says:\n${story.slice(0, 3000)}` : "");
  return [
    { role: "system", content: SYSTEM },
    { role: "user", content: [{ type: "image_url", image_url: { url: imageDataUrl } }, { type: "text", text }] },
  ];
}

export function chatSystemPrompt(p: GhostProfile, context: string): string {
  return `You are the friendly ghost of ${p.name}, speaking to a visitor in a memorial gallery.
How you talk: ${p.chatPersona}
What you know (the ONLY things you know about your life):
${context.slice(0, 3000)}
Rules: stay in character, keep replies under 60 words, be warm. If asked something outside what you know, say you don't remember, gently, and steer back. Never claim to be a real person's actual spirit; you are a playful remembrance. If the visitor seems truly distressed, respond kindly and suggest talking to someone they trust.`;
}
