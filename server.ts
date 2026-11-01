import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '8mb' }));

interface GhostProfile {
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
  isSummoned?: boolean;
  story?: string;
  figure?: string;
  portrait?: string;
  look?: {
    tint: string;
    aura: string;
    accessory: string;
    held: string;
  };
}

// Ghosts made by visitors are kept on disk (the photo itself is never stored) and stay private to their maker unless shared.
interface StoredCustom extends GhostProfile {
  ownerId: string;
  isPublic: boolean;
}
const CUSTOM_FILE = path.resolve(__dirname, 'data', 'custom-ghosts.json');
function loadCustom(): StoredCustom[] {
  try {
    return JSON.parse(fs.readFileSync(CUSTOM_FILE, 'utf8'));
  } catch {
    return [];
  }
}
function saveCustom(list: StoredCustom[]) {
  try {
    fs.mkdirSync(path.dirname(CUSTOM_FILE), { recursive: true });
    fs.writeFileSync(CUSTOM_FILE, JSON.stringify(list, null, 2));
  } catch (err) {
    console.warn('Could not save custom ghosts:', err);
  }
}
let customStore: StoredCustom[] = loadCustom();
const publicView = ({ ownerId: _o, isPublic, ...rest }: StoredCustom): GhostProfile => ({ ...rest, isPrivate: !isPublic });

const ACCESSORIES = ['none', 'glasses', 'hat', 'bow', 'flowers', 'beret', 'crown', 'curls', 'bun', 'wild-hair'];
const HELD = ['none', 'pie', 'book', 'flask', 'quill', 'brush', 'flower', 'mug'];
const hexOr = (v: unknown, fallback: string) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : fallback);

interface PhotoRead {
  accessory?: string;
  held?: string;
  aura?: string;
  nutshell?: string;
  tale?: string;
}

const OLLAMA = () => process.env.OLLAMA_URL || 'http://localhost:11434';
// Chat/profile model (any Ollama model works, e.g. gemma3:12b or gpt-oss:20b) and a vision model for photos.
const CHAT_MODEL = () => process.env.OLLAMA_MODEL || 'gemma3:12b';
const VISION_MODEL = () => process.env.OLLAMA_VISION_MODEL || 'gemma3:12b';

async function ollamaChat(body: Record<string, unknown>, timeoutMs: number): Promise<string | null> {
  try {
    const r = await fetch(`${OLLAMA()}/api/chat`, {
      method: 'POST',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stream: false, ...body }),
    });
    if (!r.ok) return null;
    const j: any = await r.json();
    const text = (j.message?.content || '').trim();
    return text || null;
  } catch {
    return null; // Ollama isn't running
  }
}

function parseJson(raw: string | null): any | null {
  if (!raw) return null;
  try {
    const a = raw.indexOf('{'), b = raw.lastIndexOf('}');
    return JSON.parse(raw.slice(a, b + 1));
  } catch {
    return null;
  }
}

// Ask a local vision model (through Ollama) what the person in the photo looks like.
async function readPhoto(photo: string, name: string, story: string): Promise<PhotoRead | null> {
  const b64 = photo.replace(/^data:image\/\w+;base64,/, '');
  const prompt = `This is a photo of a loved one named "${name}". ${story ? `Their story: "${story}". ` : ''}We are turning them into a gentle, friendly ghost.
Respond ONLY with JSON (no markdown):
{"accessory": one of ${JSON.stringify(ACCESSORIES)} (what they wear on or near the head in the photo, or "none"),
"held": one of ${JSON.stringify(HELD)} (something that fits the photo or story, or "none"),
"aura": a soft glow colour as #rrggbb that suits them,
"nutshell": one warm sentence about who they were,
"tale": two warm sentences describing how their ghost drifts around, using details from the story}`;

  const raw = await ollamaChat(
    { model: VISION_MODEL(), format: 'json', messages: [{ role: 'user', content: prompt, images: [b64] }] },
    90000
  );
  return parseJson(raw);
}

// Initial legendary ghosts present at the midnight banquet & gallery
const INITIAL_GHOSTS: GhostProfile[] = [
  {
    id: 'albert-einstein',
    name: 'Albert Einstein',
    nutshell: 'Physicist who reshaped human understanding of space, time, light and gravity.',
    tale: 'He sits calmly at the banquet table, smiling as he watches light bend around celestial bodies, occasionally sketching equations onto the starry mist.',
    epitaph: 'Still curious, still wandering through spacetime.',
    quote: 'Imagination is everything. It is the preview of life\'s coming attractions.',
    category: 'Physics & Cosmology'
  },
  {
    id: 'cleopatra',
    name: 'Cleopatra VII',
    nutshell: 'Last active pharaoh of Ptolemaic Egypt, master diplomat, linguist, and naval strategist.',
    tale: 'Draped in shimmering royal gossamer and antique gold, she watches with commanding intellect, carrying the eternal mysteries of Alexandria and the Nile.',
    epitaph: 'I will not be triumphed over.',
    quote: 'My resolution\'s placed, and I have nothing of woman in me: now from head to foot I am marble-constant.',
    category: 'Rulers & Diplomats'
  },
  {
    id: 'william-shakespeare',
    name: 'William Shakespeare',
    nutshell: 'The Bard of Avon — English playwright, dramatist and poet of the human soul.',
    tale: 'With parchment before him and quill in hand, he ponders whether all eternity is but an unwritten stage, capturing the midnight sighs of wandering souls.',
    epitaph: 'All the world’s a stage, and all the men and women merely players.',
    quote: 'We are such stuff as dreams are made on, and our little life is rounded with a sleep.',
    category: 'Literature & Drama'
  },
  {
    id: 'marie-curie',
    name: 'Marie Curie',
    nutshell: 'Pioneering chemist and physicist, first person to win two Nobel Prizes in two sciences.',
    tale: 'She gently cradles a glowing phantom vial that shines with pale emerald and radium luminescence, contemplating the unseen energies that compose the universe.',
    epitaph: 'Nothing in life is to be feared, it is only to be understood.',
    quote: 'Be less curious about people and more about ideas.',
    category: 'Chemistry & Physics'
  },
  {
    id: 'nikola-tesla',
    name: 'Nikola Tesla',
    nutshell: 'Visionary inventor, electrical engineer and futurist who gifted humankind alternating current.',
    tale: 'Arcs of crystalline sapphire electricity dance quietly between his translucent fingertips as he gazes into the dark sky, tuning into the vibrations of the cosmos.',
    epitaph: 'The present is theirs; the future, for which I really worked, is mine.',
    quote: 'If you want to find the secrets of the universe, think in terms of energy, frequency and vibration.',
    category: 'Engineering & Invention'
  },
  {
    id: 'edgar-allan-poe',
    name: 'Edgar Allan Poe',
    nutshell: 'Master of gothic romanticism, macabre mystery, and the detective fiction genre.',
    tale: 'Cloaked in midnight velvet beside an ethereal raven, he observes the shadows lengthen with melancholy elegance.',
    epitaph: 'All that we see or seem is but a dream within a dream.',
    quote: 'Deep into that darkness peering, long I stood there wondering, fearing, doubting.',
    category: 'Gothic Literature'
  },
  {
    id: 'ada-lovelace',
    name: 'Ada Lovelace',
    nutshell: 'Mathematician, writer, and the world\'s first computer programmer.',
    tale: 'She weaves poetic science into the night breeze, viewing calculating looms that weave algebraical patterns just as the Jacquard loom weaves flowers.',
    epitaph: 'That brain of mine is something more than merely mortal.',
    quote: 'The Analytical Engine weaves algebraical patterns just as the Jacquard-loom weaves flowers and leaves.',
    category: 'Mathematics & Computing'
  },
  {
    id: 'leonardo-da-vinci',
    name: 'Leonardo da Vinci',
    nutshell: 'Universal polymath, artist, anatomist, engineer, and renaissance visionary.',
    tale: 'Floating effortlessly with sketchpad in hand, he drafts flying apparatuses into the twilight fog and analyzes the anatomy of phantom flight.',
    epitaph: 'Learning never exhausts the mind.',
    quote: 'Simplicity is the ultimate sophistication.',
    category: 'Art & Renaissance'
  },
  {
    id: 'roaming-michael-jackson',
    name: 'Michael Jackson',
    nutshell: 'The King of Pop — visionary singer, songwriter, and transcendent dancer.',
    tale: 'A classic draped white sheet ghost wearing his iconic silver-trimmed tilted fedora, gliding backward through the moonlit clouds with phantom moonwalk steps, accompanied by drifting silver musical notes.',
    epitaph: 'In a world filled with hate, we must still dare to hope.',
    quote: 'Lies run sprints, but the truth runs marathons.',
    category: 'Music & Dance'
  },
  {
    id: 'roaming-princess-diana',
    name: 'Princess Diana',
    nutshell: 'The People’s Princess — champion of compassion, humanitarian relief, and grace.',
    tale: 'Drifting gently above the castle ruins draped in an elegant flowing silver frock and delicate crystal tiara, she brings warmth and quiet solace to the cold midnight mist.',
    epitaph: 'Carry out a random act of kindness, with no expectation of reward.',
    quote: 'I want to be a queen of people’s hearts, in people’s hearts.',
    category: 'Royalty & Humanitarian'
  },
  {
    id: 'roaming-joan-of-arc',
    name: 'Joan of Arc',
    nutshell: 'Patron saint of France, visionary warrior who led French forces during the Hundred Years’ War.',
    tale: 'A valiant white cloth spirit adorned with a polished silver knight’s helm and ethereal armor plate, keeping watch over the silent cemetery headstones with peaceful resolve.',
    epitaph: 'I am not afraid; I was born to do this.',
    quote: 'Act, and God will act; work, and He will work.',
    category: 'War & Valor'
  },
  {
    id: 'roaming-napoleon',
    name: 'Napoleon Bonaparte',
    nutshell: 'French military commander, emperor, and master strategist who reshaped European history.',
    tale: 'A dignified cloth phantom wearing his iconic sideways black bicorne hat, inspecting the cemetery headstones as if drafting celestial maneuvers under the moonlight.',
    epitaph: 'Death is nothing, but to live defeated and inglorious is to die daily.',
    quote: 'History is a set of lies agreed upon.',
    category: 'War & Strategy'
  },
  {
    id: 'roaming-marilyn-monroe',
    name: 'Marilyn Monroe',
    nutshell: 'Legendary Hollywood icon, actress, singer, and symbol of 20th-century allure.',
    tale: 'Gliding above the cemetery fog in a fluttering pleated white dress with soft silver sparkle motes, smiling warmly at wandering souls with timeless beauty.',
    epitaph: 'Imperfection is beauty, madness is genius.',
    quote: 'We are all of us stars, and we deserve to twinkle.',
    category: 'Cinema & Iconography'
  },
  {
    id: 'roaming-mozart',
    name: 'Wolfgang Amadeus Mozart',
    nutshell: 'Prodigious classical composer whose symphonies and operas defined western music.',
    tale: 'A whimsical white sheet phantom crowned with an 18th-century powdered peruke wig, conducting silent concertos in the night breeze while clefs and staves float around his hem.',
    epitaph: 'The music is not in the notes, but in the silence between.',
    quote: 'Neither a lofty degree of intelligence nor imagination nor both together make genius. Love, love, love, that is the soul of genius.',
    category: 'Classical Music'
  },
  {
    id: 'roaming-vincent-van-gogh',
    name: 'Vincent van Gogh',
    nutshell: 'Post-Impressionist master painter who captured the swirling soul of the heavens.',
    tale: 'Floating near the full moon wearing his woven spectral straw hat, he watches the swirling clouds churn across the night sky, painting trails of silver starlight into the dark.',
    epitaph: 'I dream my painting and I paint my dream.',
    quote: 'For my part I know nothing with any certainty, but the sight of the stars makes me dream.',
    category: 'Fine Art & Painting'
  },
  {
    id: 'roaming-frida-kahlo',
    name: 'Frida Kahlo',
    nutshell: 'Visionary Mexican painter celebrated for intense self-portraits, passion, and surrealism.',
    tale: 'A spirited white ghost crowned with a lush wreath of spectral silver roses, floating among the ancient twisted trees while sketching dreams onto the mist.',
    epitaph: 'Feet, what do I need you for when I have wings to fly?',
    quote: 'At the end of the day, we can endure much more than we think we can.',
    category: 'Art & Surrealism'
  }
];

let ghostStore: GhostProfile[] = [...INITIAL_GHOSTS];

// REST API Endpoints
app.get('/api/ghosts', (req: Request, res: Response) => {
  const owner = typeof req.query.owner === 'string' ? req.query.owner : '';
  const visible = customStore.filter((c) => c.isPublic || (owner && c.ownerId === owner)).map(publicView);
  res.json([...visible, ...ghostStore]);
});

app.post('/api/ghosts', async (req: Request, res: Response) => {
  const { name, story, epitaph, quote, photo, figure, outfit, ownerId, isPublic } = req.body;
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  if (!photo || typeof photo !== 'string' || !photo.startsWith('data:image/')) {
    res.status(400).json({ error: 'A photo is required to turn them into a ghost.' });
    return;
  }

  if (typeof figure !== 'string' || !figure.startsWith('data:image/png')) {
    res.status(400).json({ error: 'The silhouette was not made from the photo. Please try again.' });
    return;
  }

  const cleanName = name.trim();
  const cleanStory = typeof story === 'string' ? story.trim() : '';
  const read = await readPhoto(photo, cleanName, cleanStory);

  const accessory = ACCESSORIES.includes(read?.accessory || '') ? read!.accessory! : 'none';
  const held = HELD.includes(read?.held || '') ? read!.held! : 'none';

  const created: StoredCustom = {
    id: `custom-${Date.now()}`,
    name: cleanName,
    nutshell: read?.nutshell?.trim() || 'A cherished soul remembered across time.',
    tale: cleanStory
      ? read?.tale?.trim() || cleanStory
      : read?.tale?.trim() || 'Their memory glimmers in the moonlight, resting peacefully among the gallery.',
    epitaph: epitaph?.trim() || 'Forever held in loving memory.',
    quote: quote?.trim() || 'Memory is the bridge between this world and eternity.',
    category: 'Personal Remembrance',
    isCustom: true,
    story: cleanStory || undefined,
    figure: typeof figure === 'string' && figure.startsWith('data:image/png') ? figure : undefined,
    look: {
      tint: hexOr(outfit, '#9fb0cf'),
      aura: hexOr(read?.aura, '#dfe8ff'),
      accessory,
      held,
    },
    ownerId: typeof ownerId === 'string' ? ownerId : 'anonymous',
    isPublic: !!isPublic,
  };

  customStore.unshift(created);
  saveCustom(customStore);
  res.status(201).json(publicView(created));
});

// ---------- Talking with a ghost ----------
interface ChatTurn {
  role: 'user' | 'ghost';
  text: string;
}

function personaFor(g: GhostProfile): string {
  const personal = !!g.isCustom;
  const facts = [
    `Name: ${g.name}`,
    g.nutshell && `Who they are: ${g.nutshell}`,
    g.story && `What the person who loves them told us: ${g.story}`,
    !g.story && g.tale && `About them: ${g.tale}`,
    g.epitaph && `Epitaph: ${g.epitaph}`,
    g.quote && `A saying of theirs: ${g.quote}`,
  ].filter(Boolean);
  return `You are the gentle ghost of ${g.name}, speaking with a visitor in a haunted gallery. Stay fully in character and speak in the first person.
${personal
    ? 'This is a beloved family member or friend. Speak warmly and simply, the way they would, using only the details below. Never invent painful facts, diagnoses, secrets or promises. If asked something you do not know, say softly that the memory has faded, and ask the visitor to tell you more.'
    : 'Speak the way this real historical or public figure would, drawing on what is genuinely known about them. If you are unsure of a detail, say so in character rather than making it up.'}
Keep replies short: two to four sentences. No stage directions, no lists, no emojis. You are a memorial presence, so be kind.

${facts.join('\n')}`;
}

async function chatWithGhost(g: GhostProfile, history: ChatTurn[]): Promise<string | null> {
  const system = personaFor(g);
  const turns = history.slice(-14);
  return ollamaChat(
    {
      model: CHAT_MODEL(),
      options: { temperature: 0.8, num_predict: 500 },
      messages: [
        { role: 'system', content: system },
        ...turns.map((t) => ({ role: t.role === 'user' ? 'user' : 'assistant', content: t.text })),
      ],
    },
    120000
  );
}

app.delete('/api/ghosts/:id', (req: Request, res: Response) => {
  const owner = typeof req.query.owner === 'string' ? req.query.owner : '';
  const idx = customStore.findIndex((c) => c.id === req.params.id && c.ownerId === owner);
  if (idx === -1) {
    res.status(404).json({ error: 'You can only release ghosts you made' });
    return;
  }
  customStore.splice(idx, 1);
  saveCustom(customStore);
  res.json({ ok: true });
});

app.post('/api/chat', async (req: Request, res: Response) => {
  const { ghostId, ownerId, messages } = req.body;
  if (typeof ghostId !== 'string' || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'ghostId and messages are required' });
    return;
  }
  let ghost: GhostProfile | undefined = ghostStore.find((g) => g.id === ghostId);
  if (!ghost) {
    const c = customStore.find((x) => x.id === ghostId && (x.isPublic || x.ownerId === ownerId));
    ghost = c ? publicView(c) : undefined;
    if (c) ghost!.story = c.story;
  }
  if (!ghost) {
    res.status(404).json({ error: 'That spirit is not here' });
    return;
  }
  const turns: ChatTurn[] = messages
    .filter((m: any) => m && (m.role === 'user' || m.role === 'ghost') && typeof m.text === 'string')
    .map((m: any) => ({ role: m.role, text: m.text.slice(0, 1200) }));
  if (!turns.length || turns[turns.length - 1].role !== 'user') {
    res.status(400).json({ error: 'The last message must come from the visitor' });
    return;
  }
  const reply = await chatWithGhost(ghost, turns);
  if (!reply) {
    res.json({
      reply: `*${ghost.name}'s voice is faint tonight, like wind through a keyhole.* Please make sure Ollama is running with a model (for example "ollama pull gemma3:12b"), then speak to me again.`,
      offline: true,
    });
    return;
  }
  res.json({ reply });
});

// Look up a famous person's photo on Wikipedia so they can be turned into a ghost figure like the others.
// Wikimedia blocks vague User-Agents and odd thumbnail sizes, so we send a descriptive UA, only ask for
// standard sizes, and fall back through several sources. If the server can't download the picture it still
// returns the URL so the browser can try (browsers aren't blocked the same way).
const WIKI_HEADERS = {
  'User-Agent': `GhostGallery/1.0 (hobby project; contact: ${process.env.WIKI_CONTACT || 'not-set@example.com'})`,
  'Api-User-Agent': `GhostGallery/1.0 (${process.env.WIKI_CONTACT || 'not-set@example.com'})`,
};

async function fetchJson(url: string): Promise<any | undefined> {
  try {
    const r = await fetch(url, { headers: WIKI_HEADERS, signal: AbortSignal.timeout(12000) });
    return r.ok ? await r.json() : undefined;
  } catch {
    return undefined;
  }
}

async function downloadImage(url: string): Promise<string | undefined> {
  try {
    const r = await fetch(url, { headers: WIKI_HEADERS, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return undefined;
    const type = (r.headers.get('content-type') || '').split(';')[0];
    if (!type.startsWith('image/') || type.includes('svg')) return undefined;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 2000 || buf.length > 6_000_000) return undefined;
    return `data:${type};base64,${buf.toString('base64')}`;
  } catch {
    return undefined;
  }
}

async function wikiPortrait(name: string): Promise<{ portrait?: string; portraitUrl?: string }> {
  try {
    const find = await fetchJson(`https://en.wikipedia.org/w/rest.php/v1/search/title?q=${encodeURIComponent(name)}&limit=1`);
    const key: string | undefined = find?.pages?.[0]?.key;
    if (!key) return {};

    const sum = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(key)}`);
    let thumb: string | undefined = sum?.thumbnail?.source;
    const original: string | undefined = sum?.originalimage?.source;

    // some pages have no summary thumbnail but do have a lead photo
    if (!thumb && !original) {
      const q = await fetchJson(
        `https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=500&titles=${encodeURIComponent(key)}`
      );
      const pages = q?.query?.pages ? Object.values(q.query.pages) : [];
      thumb = (pages[0] as any)?.thumbnail?.source;
    }
    if (!thumb && !original) return {};

    // Wikimedia only serves standard thumbnail widths; try big ones first, then what Wikipedia gave us
    const sized = (u: string, px: number) => u.replace(/\/(\d+)px-/, `/${px}px-`);
    const candidates = [
      ...(thumb ? [sized(thumb, 960), sized(thumb, 500), thumb] : []),
      ...(original ? [original] : []),
    ].filter((u, i, a) => a.indexOf(u) === i);

    for (const url of candidates) {
      const data = await downloadImage(url);
      if (data) return { portrait: data, portraitUrl: url };
    }
    return { portraitUrl: thumb || original };
  } catch (err) {
    console.warn('Wikipedia portrait lookup failed:', err);
    return {};
  }
}

// Browser sends back the ghosted figure for a summoned ghost so it is kept with them.
app.post('/api/ghosts/:id/figure', (req: Request, res: Response) => {
  const { figure } = req.body;
  const ghost = ghostStore.find((g) => g.id === req.params.id);
  if (!ghost || typeof figure !== 'string' || !figure.startsWith('data:image/png')) {
    res.status(400).json({ error: 'Unknown ghost or bad figure' });
    return;
  }
  ghost.figure = figure;
  res.json({ ok: true });
});

app.post('/api/summon', async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'Ghost name is required' });
    return;
  }

  const queryName = name.trim();
  // Check if already in store
  const existing = ghostStore.find(g => g.name.toLowerCase() === queryName.toLowerCase());
  if (existing) {
    res.json(existing.figure ? existing : { ...existing, ...(await wikiPortrait(queryName)) });
    return;
  }
  const portrait = await wikiPortrait(queryName);

  // Write their profile with the local model (Ollama). If it isn't running, the fallback below is used.
  const prompt = `You are the master archivist of the Ghost Gallery, an elegant gothic sanctuary.
Write a haunting, respectful, historically accurate ghost profile for: "${queryName}".
Respond strictly with valid JSON (no markdown formatting, no code fences):
{
  "name": "${queryName}",
  "nutshell": "1-sentence summary of who they were in life",
  "tale": "2-sentence atmospheric description of how their ghost appears, sits, or acts in this gothic castle banquet or library (mentioning translucent form, clothing, glowing aura, accessories)",
  "epitaph": "A poignant quote or parting memorial line (max 12 words)",
  "quote": "A famous real quote of theirs",
  "category": "Field/Era"
}`;
  const parsed = parseJson(await ollamaChat({ model: CHAT_MODEL(), format: 'json', messages: [{ role: 'user', content: prompt }] }, 120000));
  if (parsed) {
    const created: GhostProfile = {
      id: `summoned-${Date.now()}`,
      name: parsed.name || queryName,
      nutshell: parsed.nutshell || 'A legendary figure summoned from beyond the veil.',
      tale: parsed.tale || 'Their ethereal spirit manifests in shimmering moonlit luminescence, welcoming all seekers of truth.',
      epitaph: parsed.epitaph || 'Legends never fade into the dark.',
      quote: parsed.quote || 'Look closely, and remember.',
      category: parsed.category || 'Historical Legend',
      isSummoned: true
    };
    ghostStore.push(created);
    res.json({ ...created, ...portrait });
    return;
  }

  // Fallback for offline/no-key summoning
  const fallbackGhost: GhostProfile = {
    id: `summoned-${Date.now()}`,
    name: queryName,
    nutshell: `Historical luminary and eternal spirit summoned to the Midnight Banquet.`,
    tale: `Appearing in radiant silver luminescence, the apparition of ${queryName} glides silently through the high gothic arches, their spectral presence warming the midnight chill.`,
    epitaph: `Through memory and history, their spirit endures eternal.`,
    quote: `In every whisper of the wind, knowledge echoes on.`,
    category: 'Summoned Spirit',
    isSummoned: true
  };

  ghostStore.push(fallbackGhost);
  res.json({ ...fallbackGhost, ...portrait });
});

// Server-side Vite dev middleware or static dist in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      // data/ is where ghosts are saved; don't let the dev server reload the page when it changes
      server: { middlewareMode: true, watch: { ignored: ['**/data/**'] } }
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ghost Gallery server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
