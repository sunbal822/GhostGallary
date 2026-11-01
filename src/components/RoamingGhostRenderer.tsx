import React, { useEffect, useRef, useState } from 'react';
import { GhostProfile, GhostLook } from '../types/ghost';
import { ROAMING_GHOSTS, RoamingGhostConfig } from '../data/roamingGhosts';
import { getLook } from '../data/looks';
import { GhostSprite } from './GhostSprite';
import { ambientSound } from '../utils/audio';

export interface HoverItem {
  id: string;
  name: string;
  profile: GhostProfile;
  look: GhostLook;
  x: number; // home space, % of scene width
  y: number; // home space, % of scene height
  mode: 'front' | 'swap'; // swap = slowly passes behind and in front of the text
  motes?: RoamingGhostConfig['motesType'];
  figure?: string; // ghosted photo cut-out; drawn instead of the smoke sprite
  figureScale?: number;
  gray?: boolean; // match the greyscale of the painted room
  drift?: number; // 1 = gentle, higher = wanders a little more
}

interface HoverProps {
  items: HoverItem[];
  presence: number; // 1 = settled in its space, 0 = gone (slid out of the scene)
  zBack: number;
  zFront: number;
  onSelect: (ghost: GhostProfile) => void;
}

/** Ghosts that hover gently inside their own space and slide out of the scene as you scroll away. */
export const HoverGhosts: React.FC<HoverProps> = ({ items, presence, zBack, zFront, onSelect }) => {
  const [, setTick] = useState(0);
  const timeRef = useRef(0);

  useEffect(() => {
    let id: number;
    let last = performance.now();
    const loop = (now: number) => {
      timeRef.current += (now - last) / 1000;
      last = now;
      setTick((t) => (t + 1) % 1000000);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);

  if (presence <= 0.01 || items.length === 0) return null;
  const t = timeRef.current;
  const p = Math.min(1, presence);
  const fade = p > 0.25 ? 1 : p / 0.25;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      {items.map((it, i) => {
        const phase = i * 2.3;
        const sp = 0.26 + (i % 3) * 0.05; // slow: a full loop takes ~20s
        const dr = it.drift ?? 1;
        const px = it.x + Math.sin(t * sp + phase) * 2.0 * dr;
        const py = it.y + Math.cos(t * sp * 0.8 + phase * 1.3) * 2.4 * dr;
        const dir = it.x < 50 ? -1 : 1;
        const ex = (1 - p) * dir * 80; // slide out sideways
        const ey = -(1 - p) * 8;
        const tilt = Math.sin(t * 0.3 + phase) * 3;
        const depth = it.mode === 'swap' ? Math.sin(t * 0.4 + phase) : 1;
        const inFront = depth >= 0;
        const crossFade = it.mode === 'swap' ? 0.65 + 0.35 * Math.min(1, Math.abs(depth) * 3) : 1;
        const scale = inFront ? 1 : 0.86;
        // heads face the middle of the scene
        const flip = it.x < 50;

        return (
          <button
            key={it.id}
            onClick={() => {
              ambientSound.playSpiritChime();
              onSelect(it.profile);
            }}
            className="absolute group cursor-pointer focus:outline-none"
            style={{
              left: `${(px + ex).toFixed(2)}%`,
              top: `${(py + ey).toFixed(2)}%`,
              transform: `translate(-50%, -50%) rotate(${tilt.toFixed(1)}deg) scale(${scale})`,
              zIndex: inFront ? zFront : zBack,
              opacity: (inFront ? 0.95 : 0.6) * crossFade * fade,
              filter: inFront ? 'none' : 'blur(0.7px)',
              pointerEvents: p > 0.9 ? 'auto' : 'none',
            }}
            aria-label={`Inspect ghost of ${it.name}`}
          >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/90 border border-neutral-700 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl text-white text-[10px] font-serif whitespace-nowrap z-40">
              ✦ {it.name}
            </div>
            <div className="transition-[filter] group-hover:brightness-125">
              {it.figure ? (
                <img
                  src={it.figure}
                  alt=""
                  draggable={false}
                  style={{
                    height: `calc(clamp(170px, 32vh, 330px) * ${it.figureScale ?? 1})`,
                    width: 'auto',
                    maxWidth: 'none',
                    filter: `${it.gray ? 'grayscale(1) ' : ''}drop-shadow(0 0 14px ${it.look.aura}88)`,
                  }}
                />
              ) : (
                <GhostSprite look={it.look} width="clamp(120px, 13vw, 200px)" flip={flip} />
              )}
            </div>
            {it.motes && (
              <div className="absolute inset-0 pointer-events-none overflow-visible">{renderMotes(it.motes, t + phase)}</div>
            )}
          </button>
        );
      })}
    </div>
  );
};

// Four spaces per scene: [x%, y%, mode], in the same order as the ghosts in roamingGhosts.ts
const SPACES: Record<'exterior' | 'dining' | 'graveyard', [number, number, 'front' | 'swap'][]> = {
  exterior: [
    [15, 27, 'front'],
    [85, 30, 'front'],
    [69, 72, 'swap'],
    [31, 74, 'swap'],
  ],
  graveyard: [
    [13, 34, 'front'],
    [87, 36, 'front'],
    [31, 62, 'swap'],
    [69, 62, 'swap'],
  ],
  dining: [],
};

interface Props {
  scene: 'exterior' | 'dining' | 'graveyard';
  presence: number;
  onSelectGhost: (ghost: GhostProfile) => void;
}

export const RoamingGhostRenderer: React.FC<Props> = ({ scene, presence, onSelectGhost }) => {
  const spaces = SPACES[scene];
  const items: HoverItem[] = ROAMING_GHOSTS.filter((g) => g.scene === scene).map((g, i) => ({
    id: g.id,
    name: g.name,
    profile: g.profile,
    look: getLook({ id: g.id, name: g.name }),
    x: spaces[i % spaces.length][0],
    y: spaces[i % spaces.length][1],
    mode: spaces[i % spaces.length][2],
    motes: g.motesType,
  }));
  const zBack = scene === 'exterior' ? 12 : 30;
  const zFront = scene === 'exterior' ? 32 : 40;
  return <HoverGhosts items={items} presence={presence} zBack={zBack} zFront={zFront} onSelect={onSelectGhost} />;
};

// Ghosts made or summoned by visitors (Grandma Susie, Liam Payne...) appear in free parts of the dining room.
// [x%, y%, size]. There is no limit: after the named spots, more are spread along the front of the table.
const DINING_SPACES: [number, number, number][] = [
  [6, 42, 1],
  [94, 42, 1],
  [27, 17, 0.62],
  [73, 17, 0.62],
  [12, 80, 0.8],
  [88, 80, 0.8],
];
function diningSpace(i: number): [number, number, number] {
  if (i < DINING_SPACES.length) return DINING_SPACES[i];
  const k = i - DINING_SPACES.length;
  return [18 + ((k * 17) % 64), 70 + ((k * 7) % 12), 0.55];
}

interface DiningProps {
  ghosts: GhostProfile[];
  presence: number;
  onSelectGhost: (ghost: GhostProfile) => void;
}

export const DiningVisitors: React.FC<DiningProps> = ({ ghosts, presence, onSelectGhost }) => {
  const items: HoverItem[] = ghosts.map((g, i) => {
    const [x, y, size] = diningSpace(i);
    return {
      id: g.id,
      name: g.name,
      profile: g,
      look: getLook(g),
      x,
      y,
      mode: 'front',
      figure: g.figure,
      figureScale: size,
    };
  });
  return <HoverGhosts items={items} presence={presence} zBack={2} zFront={3} onSelect={onSelectGhost} />;
};

// Soft motes drifting around the famous ghosts (notes, roses, swirls, sparks)
function renderMotes(type: RoamingGhostConfig['motesType'], time: number) {
  const items = [];
  for (let i = 0; i < 3; i++) {
    const angle = time * 0.9 + (i * Math.PI * 2) / 3;
    const rad = 70 + Math.sin(time * 1.2 + i) * 8;
    const mx = Math.cos(angle) * rad;
    const my = Math.sin(angle) * rad * 0.5;
    const alpha = 0.45 + 0.4 * Math.sin(time * 1.5 + i);
    let content = '✦';
    if (type === 'music') content = i % 2 === 0 ? '♪' : '♫';
    else if (type === 'roses') content = '✿';
    else if (type === 'swirls') content = '◌';
    else if (type === 'sparks') content = '✧';
    items.push(
      <span
        key={i}
        className="absolute text-white font-serif select-none pointer-events-none drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]"
        style={{ left: `calc(50% + ${mx}px)`, top: `calc(50% + ${my}px)`, opacity: alpha, fontSize: '12px', transform: 'translate(-50%, -50%)' }}
      >
        {content}
      </span>
    );
  }
  return items;
}

// ---- Crowd mode: once visitors add ghosts, the table is gone and everyone hovers together ----
export const PAINTED_FIVE = ['albert-einstein', 'cleopatra', 'william-shakespeare', 'marie-curie', 'nikola-tesla'];

function crowdSpace(i: number, n: number): [number, number, number] {
  const perRow = 8;
  const rows = Math.ceil(n / perRow);
  const row = Math.floor(i / perRow);
  const inRow = row === rows - 1 ? n - row * perRow : perRow;
  const col = i - row * perRow;
  const step = 78 / Math.max(1, inRow);
  const stagger = row % 2 === 1 ? step * 0.4 : 0;
  const x = 11 + step * (col + 0.5) + stagger;
  const y = rows === 1 ? 56 : 46 + (row * 22) / Math.max(1, rows - 1);
  const size = rows === 1 ? 1.15 : 0.8 + (0.35 * row) / Math.max(1, rows - 1);
  return [x, y, size];
}

interface CrowdProps {
  ghosts: GhostProfile[]; // all ghosts known to the gallery
  extras: GhostProfile[]; // visitor-made and summoned ones
  presence: number;
  onSelectGhost: (ghost: GhostProfile) => void;
}

export const DiningCrowd: React.FC<CrowdProps> = ({ ghosts, extras, presence, onSelectGhost }) => {
  const painted: GhostProfile[] = PAINTED_FIVE.map((id) => ghosts.find((g) => g.id === id)).filter(
    (g): g is GhostProfile => !!g
  );
  // mix the visitors in between the five instead of lining them up at the end
  const order: GhostProfile[] = [];
  const queue = [...extras];
  painted.forEach((g) => {
    order.push(g);
    const e = queue.shift();
    if (e) order.push(e);
  });
  order.push(...queue);

  const items: HoverItem[] = order.map((g, i) => {
    const [x, y, size] = crowdSpace(i, order.length);
    const isPainted = PAINTED_FIVE.includes(g.id);
    return {
      id: g.id,
      name: g.name,
      profile: g,
      look: getLook(g),
      x,
      y,
      mode: 'front',
      figure: isPainted ? `/static/img/figures/${g.id}.png` : g.figure,
      figureScale: size * (order.length <= 5 ? 1.25 : order.length <= 7 ? 1.08 : 0.92),
      gray: isPainted,
      drift: 1.8,
    };
  });
  return <HoverGhosts items={items} presence={presence} zBack={2} zFront={3} onSelect={onSelectGhost} />;
};
