import React from 'react';
import { GhostLook, AccessoryId, HeldId } from '../types/ghost';

export const SPRITE_URL = '/static/img/phantom_sprite.png';
// Head centre of the sprite, as a share of its width/height.
const HEAD_X = 19.5;
const HEAD_Y = 25;

function alpha(hex: string, a: number) {
  const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex : '#dfe8ff';
  return `${h}${Math.round(a * 255).toString(16).padStart(2, '0')}`;
}

const STROKE = '#f4f6fb';

const ACCESSORIES: Record<Exclude<AccessoryId, 'none'>, { top: number; w: number; node: React.ReactNode }> = {
  'mj-fedora': {
    top: 17, w: 26,
    node: (
      <svg viewBox="0 0 40 20" className="-rotate-12 overflow-visible">
        <ellipse cx="20" cy="14" rx="18" ry="4" fill="#0a0b10" stroke={STROKE} strokeWidth="0.8" />
        <path d="M 10,14 L 12,6 Q 20,4 28,6 L 30,14 Z" fill="#0a0b10" stroke={STROKE} strokeWidth="0.8" />
        <path d="M 11,13 L 29,13" stroke="#e2e8f0" strokeWidth="1.8" />
      </svg>
    ),
  },
  'diana-frock': {
    top: 16, w: 20,
    node: (
      <svg viewBox="0 0 30 16" className="overflow-visible">
        <path d="M 4,12 Q 9,3 15,2 Q 21,3 26,12" fill="none" stroke="#fff" strokeWidth="1.2" />
        <circle cx="15" cy="2" r="1.5" fill="#fff" />
        <circle cx="9" cy="5" r="1.2" fill="#fff" />
        <circle cx="21" cy="5" r="1.2" fill="#fff" />
      </svg>
    ),
  },
  'napoleon-bicorne': {
    top: 17, w: 26,
    node: (
      <svg viewBox="0 0 44 22" className="overflow-visible">
        <path d="M 2,16 C 8,6 18,4 22,5 C 26,4 36,6 42,16 C 32,13 12,13 2,16 Z" fill="#08090d" stroke={STROKE} strokeWidth="1" />
        <circle cx="22" cy="11" r="2.2" fill="#fff" stroke="#94a3b8" strokeWidth="0.8" />
      </svg>
    ),
  },
  'joan-helm': {
    top: 17, w: 21,
    node: (
      <svg viewBox="0 0 32 18" className="overflow-visible">
        <path d="M 6,14 C 6,6 10,3 16,3 C 22,3 26,6 26,14 Z" fill="#1e2430" stroke={STROKE} strokeWidth="1.2" />
        <line x1="8" y1="11" x2="24" y2="11" stroke="#fff" strokeWidth="1" />
        <circle cx="16" cy="0.5" r="2" fill="none" stroke="#fff" strokeWidth="0.8" />
      </svg>
    ),
  },
  'vangogh-hat': {
    top: 17, w: 26,
    node: (
      <svg viewBox="0 0 42 20" className="overflow-visible">
        <ellipse cx="21" cy="14" rx="19" ry="4" fill="#4a4636" stroke={STROKE} strokeWidth="1" />
        <path d="M 11,14 C 12,7 15,5 21,5 C 27,5 30,7 31,14 Z" fill="#3a3628" stroke={STROKE} strokeWidth="0.8" />
        <line x1="12" y1="13" x2="30" y2="13" stroke="#94a3b8" strokeWidth="1.5" />
      </svg>
    ),
  },
  'mozart-wig': {
    top: 21, w: 26,
    node: (
      <svg viewBox="0 0 36 22" className="overflow-visible">
        <circle cx="6" cy="12" r="4.5" fill="#e2e8f0" stroke="#fff" strokeWidth="0.8" />
        <circle cx="30" cy="12" r="4.5" fill="#e2e8f0" stroke="#fff" strokeWidth="0.8" />
        <path d="M 8,11 C 10,2 26,2 28,11 Z" fill="#f8fafc" stroke="#fff" strokeWidth="1" />
      </svg>
    ),
  },
  'marilyn-dress': {
    top: 19, w: 22,
    node: (
      <svg viewBox="0 0 32 16" className="overflow-visible">
        <path d="M 6,12 C 4,6 10,2 16,2 C 22,2 28,6 26,12 C 22,9 10,9 6,12 Z" fill="#fff" stroke="#cbd5e1" strokeWidth="0.8" />
      </svg>
    ),
  },
  'frida-crown': {
    top: 18, w: 24,
    node: (
      <svg viewBox="0 0 34 16" className="overflow-visible">
        <circle cx="7" cy="9" r="3" fill="#fff" stroke="#94a3b8" strokeWidth="0.8" />
        <circle cx="13" cy="6" r="3.2" fill="#ffd3e0" stroke="#94a3b8" strokeWidth="0.8" />
        <circle cx="20" cy="6" r="3.2" fill="#fff" stroke="#94a3b8" strokeWidth="0.8" />
        <circle cx="27" cy="9" r="3" fill="#ffd3e0" stroke="#94a3b8" strokeWidth="0.8" />
      </svg>
    ),
  },
  crown: {
    top: 16, w: 19,
    node: (
      <svg viewBox="0 0 30 16" className="overflow-visible">
        <path d="M 3,14 L 5,4 L 11,9 L 15,2 L 19,9 L 25,4 L 27,14 Z" fill="#efe3a9" stroke="#fff" strokeWidth="0.8" />
      </svg>
    ),
  },
  'wild-hair': {
    top: 24, w: 28,
    node: (
      <svg viewBox="0 0 40 20" className="overflow-visible">
        <path d="M 4,16 Q 0,8 8,6 Q 8,0 16,3 Q 22,-2 28,3 Q 36,1 35,8 Q 41,12 35,17 Q 30,9 20,9 Q 10,9 4,16 Z" fill="#f2f5fa" stroke="#fff" strokeWidth="0.8" />
      </svg>
    ),
  },
  bun: {
    top: 11, w: 12,
    node: (
      <svg viewBox="0 0 20 20" className="overflow-visible">
        <circle cx="10" cy="10" r="8" fill="#dfe5ef" stroke="#fff" strokeWidth="1" />
        <path d="M 4,10 Q 10,4 16,10" fill="none" stroke="#aab4c6" strokeWidth="0.8" />
      </svg>
    ),
  },
  beret: {
    top: 16, w: 24,
    node: (
      <svg viewBox="0 0 36 18" className="-rotate-6 overflow-visible">
        <ellipse cx="18" cy="11" rx="16" ry="6" fill="#2a2b3a" stroke={STROKE} strokeWidth="0.9" />
        <circle cx="18" cy="4" r="1.6" fill="#2a2b3a" stroke={STROKE} strokeWidth="0.6" />
      </svg>
    ),
  },
  bow: {
    top: 15, w: 15,
    node: (
      <svg viewBox="0 0 30 16" className="overflow-visible">
        <path d="M 15,8 L 3,2 L 3,14 Z" fill="#e9defa" stroke="#fff" strokeWidth="0.8" />
        <path d="M 15,8 L 27,2 L 27,14 Z" fill="#e9defa" stroke="#fff" strokeWidth="0.8" />
        <circle cx="15" cy="8" r="2.4" fill="#cdbbf0" stroke="#fff" strokeWidth="0.8" />
      </svg>
    ),
  },
  glasses: {
    top: 30, w: 16,
    node: (
      <svg viewBox="0 0 40 16" className="overflow-visible">
        <circle cx="10" cy="8" r="6.5" fill="rgba(255,255,255,0.08)" stroke="#fff" strokeWidth="1.2" />
        <circle cx="30" cy="8" r="6.5" fill="rgba(255,255,255,0.08)" stroke="#fff" strokeWidth="1.2" />
        <path d="M 16.5,8 Q 20,5 23.5,8" fill="none" stroke="#fff" strokeWidth="1.2" />
      </svg>
    ),
  },
  hat: {
    top: 16, w: 22,
    node: (
      <svg viewBox="0 0 40 24" className="overflow-visible">
        <ellipse cx="20" cy="19" rx="18" ry="4" fill="#15161d" stroke={STROKE} strokeWidth="0.9" />
        <path d="M 9,19 L 10,3 L 30,3 L 31,19 Z" fill="#15161d" stroke={STROKE} strokeWidth="0.9" />
        <path d="M 9.5,15 L 30.5,15" stroke="#9aa3b5" strokeWidth="1.6" />
      </svg>
    ),
  },
  flowers: {
    top: 18, w: 22,
    node: (
      <svg viewBox="0 0 34 14" className="overflow-visible">
        <circle cx="6" cy="9" r="3" fill="#fff" stroke="#94a3b8" strokeWidth="0.7" />
        <circle cx="13" cy="6" r="3.2" fill="#ffd9e3" stroke="#94a3b8" strokeWidth="0.7" />
        <circle cx="20" cy="6" r="3.2" fill="#fff" stroke="#94a3b8" strokeWidth="0.7" />
        <circle cx="27" cy="9" r="3" fill="#ffd9e3" stroke="#94a3b8" strokeWidth="0.7" />
      </svg>
    ),
  },
  curls: {
    top: 19, w: 21,
    node: (
      <svg viewBox="0 0 36 14" className="overflow-visible">
        <path d="M 2,13 Q 1,5 7,5 Q 9,0 15,3 Q 20,-1 24,3 Q 31,1 31,7 Q 36,9 33,13 Q 18,8 2,13 Z" fill="#cfd5df" stroke="#fff" strokeWidth="0.8" />
      </svg>
    ),
  },
};

const HELD: Record<Exclude<HeldId, 'none'>, React.ReactNode> = {
  pie: (
    <svg viewBox="0 0 40 28" className="overflow-visible">
      <ellipse cx="20" cy="20" rx="17" ry="5" fill="#e8dcc0" stroke="#fff" strokeWidth="0.8" />
      <path d="M 4,19 Q 20,2 36,19 Q 20,26 4,19 Z" fill="#c9a064" stroke="#fff" strokeWidth="0.8" />
      <path d="M 12,13 L 16,18 M 20,10 L 20,17 M 28,13 L 24,18" stroke="#8a6a3a" strokeWidth="0.9" />
      <path d="M 14,6 Q 12,2 15,0 M 24,6 Q 22,2 25,0" stroke="#fff" strokeWidth="0.8" fill="none" opacity="0.7" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 40 28" className="overflow-visible">
      <path d="M 3,4 L 20,7 L 37,4 L 37,24 L 20,27 L 3,24 Z" fill="#e6e1f2" stroke="#fff" strokeWidth="0.9" />
      <line x1="20" y1="7" x2="20" y2="27" stroke="#8d86a6" strokeWidth="0.9" />
    </svg>
  ),
  flask: (
    <svg viewBox="0 0 28 36" className="overflow-visible">
      <path d="M 10,2 L 18,2 L 18,14 L 26,32 L 2,32 L 10,14 Z" fill="rgba(143,240,220,0.55)" stroke="#fff" strokeWidth="1" />
    </svg>
  ),
  quill: (
    <svg viewBox="0 0 30 36" className="overflow-visible">
      <path d="M 26,2 C 14,4 8,16 6,32 C 14,26 24,18 26,2 Z" fill="#f2f5fa" stroke="#fff" strokeWidth="0.9" />
      <line x1="6" y1="32" x2="22" y2="8" stroke="#8d96a8" strokeWidth="0.8" />
    </svg>
  ),
  brush: (
    <svg viewBox="0 0 12 40" className="overflow-visible">
      <rect x="4.5" y="12" width="3" height="26" rx="1.2" fill="#caa57a" stroke="#fff" strokeWidth="0.7" />
      <path d="M 3,12 L 6,0 L 9,12 Z" fill="#f2f5fa" stroke="#fff" strokeWidth="0.7" />
    </svg>
  ),
  flower: (
    <svg viewBox="0 0 24 36" className="overflow-visible">
      <line x1="12" y1="14" x2="12" y2="35" stroke="#9fc4a5" strokeWidth="1.4" />
      <circle cx="12" cy="8" r="6" fill="#ffd3e0" stroke="#fff" strokeWidth="0.9" />
      <circle cx="12" cy="8" r="2" fill="#fff3a8" />
    </svg>
  ),
  mug: (
    <svg viewBox="0 0 34 32" className="overflow-visible">
      <path d="M 4,8 L 24,8 L 23,28 Q 14,31 5,28 Z" fill="#e8ecf5" stroke="#fff" strokeWidth="0.9" />
      <path d="M 24,12 Q 33,12 30,21 Q 27,24 23,23" fill="none" stroke="#fff" strokeWidth="1.2" />
      <path d="M 10,5 Q 8,1 11,-1 M 17,5 Q 15,1 18,-1" stroke="#fff" strokeWidth="0.8" fill="none" opacity="0.7" />
    </svg>
  ),
};

interface Props {
  look: GhostLook;
  width?: string;
  flip?: boolean; // head on the right instead of the left
  className?: string;
  style?: React.CSSProperties;
}

/** The shared Phantom smoke-ghost, styled per ghost with a tint, aura, accessory and held item. */
export const GhostSprite: React.FC<Props> = ({ look, width = '160px', flip = false, className, style }) => {
  const acc = look.accessory !== 'none' ? ACCESSORIES[look.accessory] : null;
  const held = look.held !== 'none' ? HELD[look.held] : null;
  const maskUrl = `url(${SPRITE_URL})`;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width,
        aspectRatio: '714 / 531',
        transform: flip ? 'scaleX(-1)' : undefined,
        filter: `drop-shadow(0 0 14px ${alpha(look.aura, 0.55)})`,
        ...style,
      }}
    >
      <img
        src={SPRITE_URL}
        alt=""
        draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', userSelect: 'none' }}
      />
      {/* Outfit tint, clipped to the smoke shape */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          WebkitMaskImage: maskUrl,
          maskImage: maskUrl,
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
          background: `radial-gradient(ellipse 46% 56% at 40% 62%, ${alpha(look.tint, 0.95)} 0%, ${alpha(look.tint, 0.6)} 45%, ${alpha(look.tint, 0)} 100%)`,
          opacity: 0.6,
        }}
      />
      {acc && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: `${HEAD_X}%`,
            top: `${acc.top}%`,
            width: `${acc.w}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {acc.node}
        </div>
      )}
      {held && (
        <div
          aria-hidden="true"
          style={{ position: 'absolute', left: '33%', top: '58%', width: '13%', transform: 'translate(-50%, -50%) rotate(-6deg)' }}
        >
          {held}
        </div>
      )}
    </div>
  );
};
