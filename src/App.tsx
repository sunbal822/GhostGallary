/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { GhostProfile, GraveyardMemorial } from './types/ghost';
import { GRAVEYARD_MEMORIALS } from './data/memorials';
import { LivingDiningSpirits } from './components/LivingDiningSpirits';
import { RoamingGhostRenderer, DiningCrowd } from './components/RoamingGhostRenderer';
import { GhostProfileModal } from './components/GhostProfileModal';
import { SummonModal } from './components/SummonModal';
import { CreateGhostModal } from './components/CreateGhostModal';
import { GalleryDrawer } from './components/GalleryDrawer';
import { BanquetBanterModal } from './components/BanquetBanterModal';
import { MemorialModal } from './components/MemorialModal';
import { SpectralOverlay } from './components/SpectralOverlay';
import { Navigation } from './components/Navigation';
import { ambientSound } from './utils/audio';
import { getOwnerId } from './utils/owner';
import { Search, Heart, BookOpen, MessageSquareQuote, Flower2 } from 'lucide-react';

const INITIAL_FAMOUS_MAP: Record<string, Partial<GhostProfile>> = {
  'Albert Einstein': {
    id: 'albert-einstein',
    name: 'Albert Einstein',
    nutshell: 'Physicist who reshaped human understanding of space, time, light and gravity.',
    tale: 'He sits calmly at the banquet table, smiling as he watches light bend around celestial bodies, occasionally sketching equations onto the starry mist.',
    epitaph: 'Still curious, still wandering through spacetime.',
    quote: 'Imagination is everything. It is the preview of life\'s coming attractions.',
    category: 'Physics & Cosmology',
  },
  'Cleopatra': {
    id: 'cleopatra',
    name: 'Cleopatra VII',
    nutshell: 'Last active pharaoh of Ptolemaic Egypt, master diplomat, linguist, and naval strategist.',
    tale: 'Draped in shimmering royal gossamer and antique silver, she watches with commanding intellect, carrying the eternal mysteries of Alexandria and the Nile.',
    epitaph: 'I will not be triumphed over.',
    quote: 'My resolution\'s placed, and I have nothing of woman in me: now from head to foot I am marble-constant.',
    category: 'Rulers & Diplomats',
  },
  'William Shakespeare': {
    id: 'william-shakespeare',
    name: 'William Shakespeare',
    nutshell: 'The Bard of Avon — English playwright, dramatist and poet of the human soul.',
    tale: 'With parchment before him and quill in hand, he ponders whether all eternity is but an unwritten stage, capturing the midnight sighs of wandering souls.',
    epitaph: 'All the world’s a stage, and all the men and women merely players.',
    quote: 'We are such stuff as dreams are made on, and our little life is rounded with a sleep.',
    category: 'Literature & Drama',
  },
  'Marie Curie': {
    id: 'marie-curie',
    name: 'Marie Curie',
    nutshell: 'Pioneering chemist and physicist, first person to win two Nobel Prizes in two sciences.',
    tale: 'She gently cradles a glowing phantom vial that shines with pale silver luminescence, contemplating the unseen energies that compose the universe.',
    epitaph: 'Nothing in life is to be feared, it is only to be understood.',
    quote: 'Be less curious about people and more about ideas.',
    category: 'Chemistry & Physics',
  },
  'Nikola Tesla': {
    id: 'nikola-tesla',
    name: 'Nikola Tesla',
    nutshell: 'Visionary inventor, electrical engineer and futurist who gifted humankind alternating current.',
    tale: 'Arcs of crystalline white electricity dance quietly between his translucent fingertips as he gazes into the dark sky, tuning into the vibrations of the cosmos.',
    epitaph: 'The present is theirs; the future, for which I really worked, is mine.',
    quote: 'If you want to find the secrets of the universe, think in terms of energy, frequency and vibration.',
    category: 'Engineering & Invention',
  },
};

export default function App() {
  // Application Data State
  const [allGhosts, setGhosts] = useState<GhostProfile[]>([]);
  // Private ghosts (like Grandma Susie) stay hidden until their maker chooses to bring them out
  const [showMine, setShowMine] = useState(false);
  const ghosts = allGhosts.filter((g) => !g.isPrivate || showMine);
  const privateCount = allGhosts.filter((g) => g.isPrivate).length;
  const [selectedGhost, setSelectedGhost] = useState<GhostProfile | null>(null);
  const [isSummonOpen, setIsSummonOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRosterOpen, setIsRosterOpen] = useState(false);

  // New Features State: Banter, Memorials, Spectral Vision
  const [isBanterOpen, setIsBanterOpen] = useState(false);
  const [memorials, setMemorials] = useState<GraveyardMemorial[]>(GRAVEYARD_MEMORIALS);
  const [selectedMemorial, setSelectedMemorial] = useState<GraveyardMemorial | null>(null);
  const [isSpectralVision, setIsSpectralVision] = useState(false);

  // Cinematic Scroll & Animation References
  const [scrollProgress, setScrollProgress] = useState(0);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);

  // DOM Elements References
  const cameraRigRef = useRef<HTMLDivElement | null>(null);
  const sceneExteriorRef = useRef<HTMLDivElement | null>(null);
  const sceneDiningRef = useRef<HTMLDivElement | null>(null);
  // Once visitors add ghosts, the table disappears and everyone hovers together in the room
  const dinerExtras = ghosts.filter((g) => g.isCustom || g.isSummoned);
  const crowd = dinerExtras.length > 0;
  const diningGhostsRef = useRef<HTMLDivElement | null>(null);
  const sceneGraveyardRef = useRef<HTMLDivElement | null>(null);
  const portalFlashRef = useRef<HTMLDivElement | null>(null);
  const heroCardRef = useRef<HTMLDivElement | null>(null);
  const diningHeaderRef = useRef<HTMLDivElement | null>(null);
  const diningDockRef = useRef<HTMLDivElement | null>(null);
  const graveyardPanelRef = useRef<HTMLDivElement | null>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement | null>(null);

  // Load ghost database from backend API
  const fetchGhosts = useCallback(async () => {
    try {
      const res = await fetch(`/api/ghosts?owner=${encodeURIComponent(getOwnerId())}`);
      if (res.ok) {
        const data = await res.json();
        setGhosts(data);
      }
    } catch {
      const defaultList: GhostProfile[] = Object.values(INITIAL_FAMOUS_MAP) as GhostProfile[];
      setGhosts(defaultList);
    }
  }, []);

  useEffect(() => {
    fetchGhosts();
  }, [fetchGhosts]);

  // Handle Hotkeys (V for Spectral Vision)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'v' || e.key === 'V') {
        setIsSpectralVision((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Scroll Progress Calculation
  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0) {
        targetProgressRef.current = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      } else {
        targetProgressRef.current = 0;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Main 60fps RequestAnimationFrame Animation Loop
  useEffect(() => {
    let animId: number;

    const tick = () => {
      currentProgressRef.current +=
        (targetProgressRef.current - currentProgressRef.current) * 0.082;
      const p = currentProgressRef.current;
      setScrollProgress(p);

      const rig = cameraRigRef.current;
      const ext = sceneExteriorRef.current;
      const din = sceneDiningRef.current;
      const grave = sceneGraveyardRef.current;
      const flash = portalFlashRef.current;
      const hero = heroCardRef.current;
      const dHead = diningHeaderRef.current;
      const dDock = diningDockRef.current;
      const gPanel = graveyardPanelRef.current;
      const sInd = scrollIndicatorRef.current;

      /* ========================================================
         ACT 1: STEADY CASTLE EXTERIOR -> SMOOTH WINDOW ZOOM
         ======================================================== */
      if (ext && rig) {
        if (p < 0.38) {
          ext.style.display = 'block';

          const zoomP = Math.min(1, p / 0.28);
          const scale = 1 + Math.pow(zoomP, 2.6) * 11.5;

          ext.style.transform = `scale(${scale.toFixed(4)})`;
          rig.style.transform = 'rotateX(0deg) rotateY(0deg) rotateZ(0deg)';

          const textAlpha = Math.max(0, 1 - p / 0.12);
          if (hero) {
            hero.style.opacity = textAlpha.toFixed(3);
            hero.style.transform = `translateY(${(-p * 45).toFixed(0)}px)`;
            hero.style.pointerEvents = textAlpha > 0.05 ? 'auto' : 'none';
          }
          if (sInd) {
            sInd.style.opacity = textAlpha.toFixed(3);
          }

          let flashAlpha = 0;
          if (p > 0.20 && p < 0.34) {
            flashAlpha = Math.sin(((p - 0.20) / 0.14) * Math.PI);
          }
          if (flash) {
            flash.style.opacity = (flashAlpha * 0.78).toFixed(3);
          }

          const extAlpha = Math.max(0, 1 - Math.max(0, (p - 0.24) / 0.10));
          ext.style.opacity = extAlpha.toFixed(3);
        } else {
          ext.style.display = 'none';
          if (flash) flash.style.opacity = '0';
        }
      }

      /* ========================================================
         ACT 2: THE HAUNTED DINING ROOM (p: 0.20 to 0.78)
         ======================================================== */
      if (din && rig) {
        if (p >= 0.20 && p <= 0.78) {
          din.style.display = 'block';

          if (p < 0.36) {
            const inP = (p - 0.20) / 0.16;
            const dinScale = 3.6 - inP * 2.6; // 3.6 -> 1.0
            din.style.transform = `scale(${dinScale.toFixed(4)})`;
            const dinAlpha = Math.min(1, inP * 1.5);
            din.style.opacity = dinAlpha.toFixed(3);

            din.style.pointerEvents = 'none';
            if (dHead) dHead.style.opacity = '0';
            if (dDock) dDock.style.opacity = '0';
          } else if (p >= 0.36 && p <= 0.62) {
            din.style.transform = 'scale(1.0)';
            din.style.opacity = '1';
            din.style.pointerEvents = 'auto';

            if (dHead) dHead.style.opacity = '1';
            if (dDock) dDock.style.opacity = '1';
          } else {
            const outP = (p - 0.62) / 0.14;
            const exitScale = 1.0 + Math.pow(outP, 2.0) * 4.6;
            din.style.transform = `scale(${exitScale.toFixed(4)})`;
            const dinAlpha = Math.max(0, 1 - outP);
            din.style.opacity = dinAlpha.toFixed(3);

            din.style.pointerEvents = 'none';
            if (dHead) dHead.style.opacity = Math.max(0, 1 - outP * 2.5).toFixed(3);
            if (dDock) dDock.style.opacity = Math.max(0, 1 - outP * 2.5).toFixed(3);
          }
        } else {
          din.style.display = 'none';
          din.style.pointerEvents = 'none';
        }
      }

      // Visitor ghosts live in their own layer (so their colours aren't greyed); mirror the dining scene.
      const dGhosts = diningGhostsRef.current;
      if (dGhosts && din) {
        dGhosts.style.display = din.style.display || 'block';
        dGhosts.style.transform = din.style.transform;
        dGhosts.style.opacity = din.style.opacity;
      }

      /* ========================================================
         ACT 3: THE HAUNTED GRAVEYARD (p: 0.64 to 1.0)
         ======================================================== */
      if (grave && rig) {
        if (p >= 0.64) {
          grave.style.display = 'block';
          const graveP = (p - 0.64) / 0.32;

          const graveScale = 1.25 - Math.min(1, graveP) * 0.25;
          const graveY = (1 - Math.min(1, graveP)) * 10;

          grave.style.transform = `scale(${graveScale.toFixed(4)}) translateY(${graveY.toFixed(2)}vh)`;
          const gAlpha = Math.min(1, graveP * 1.4);
          grave.style.opacity = gAlpha.toFixed(3);

          if (p >= 0.76) {
            grave.style.pointerEvents = 'auto';
            if (gPanel) gPanel.style.opacity = '1';
          } else {
            grave.style.pointerEvents = 'none';
            if (gPanel) gPanel.style.opacity = Math.max(0, (p - 0.68) / 0.1).toFixed(3);
          }
        } else {
          grave.style.display = 'none';
          grave.style.pointerEvents = 'none';
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Smooth Navigation Anchor Functions
  const scrollTo = (target: 'top' | 'dining' | 'graveyard') => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (target === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (target === 'dining') {
      window.scrollTo({ top: maxScroll * 0.46, behavior: 'smooth' });
    } else if (target === 'graveyard') {
      window.scrollTo({ top: maxScroll * 0.95, behavior: 'smooth' });
    }
  };

  const openSpiritByName = (name: string) => {
    ambientSound.playSpiritChime();
    const found =
      ghosts.find((g) => g.name.toLowerCase() === name.toLowerCase()) ||
      INITIAL_FAMOUS_MAP[name];
    if (found) {
      setSelectedGhost(found as GhostProfile);
    }
  };

  const handleOfferRose = (id: string) => {
    setMemorials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, hasOfferedRose: true } : m))
    );
    if (selectedMemorial && selectedMemorial.id === id) {
      setSelectedMemorial((prev) => (prev ? { ...prev, hasOfferedRose: true } : null));
    }
  };

  return (
    <div
      className={`relative min-h-screen bg-black text-[#f2f0fc] select-none font-sans overflow-x-hidden transition-all duration-700 ${
        isSpectralVision ? 'spectral-mode' : ''
      }`}
    >
      {/* Top Bar Navigation */}
      <Navigation
        onScrollTo={scrollTo}
        onOpenRoster={() => setIsRosterOpen(true)}
        onOpenSummon={() => setIsSummonOpen(true)}
        isSpectralVision={isSpectralVision}
        onToggleSpectralVision={() => setIsSpectralVision((prev) => !prev)}
      />

      {/* Spectral Vision Mode Overlay (Feature 3) */}
      <SpectralOverlay
        isActive={isSpectralVision}
        onToggle={() => setIsSpectralVision((prev) => !prev)}
      />

      {/* Optical Portal Flash */}
      <div
        ref={portalFlashRef}
        className="fixed inset-0 pointer-events-none z-45 transition-opacity duration-150"
        style={{
          opacity: 0,
          background:
            'radial-gradient(circle at 48.5% 28.5%, rgba(255,255,255,0.95) 0%, rgba(220,225,235,0.7) 30%, rgba(12,14,18,0.96) 80%, #000000 100%)',
        }}
        aria-hidden="true"
      />

      {/* Fixed Master Viewport with 3D Perspective Rig */}
      <div
        id="viewport-world"
        className="fixed inset-0 w-screen h-screen overflow-hidden bg-black z-10"
        style={{ perspective: '1200px', perspectiveOrigin: '50% 50%' }}
      >
        <div
          ref={cameraRigRef}
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
        >
          {/* ========================================================
              ACT 1: THE HAUNTED CASTLE (LANDING EXPERIENCE)
              ======================================================== */}
          <div
            ref={sceneExteriorRef}
            className={`absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat scene-crisp grayscale contrast-[1.10] brightness-[0.98] z-10 transition-filter duration-700 ${
              isSpectralVision ? 'invert-[0.08] contrast-[1.25]' : ''
            }`}
            style={{
              backgroundImage: 'url("/static/img/exterior.jpg")',
              transformOrigin: '48.5% 28.5%',
            }}
          >
            {/* Glowing Window Beacon on Castle Tower */}
            <div
              className="absolute left-[48.5%] top-[28.5%] -translate-x-1/2 -translate-y-1/2 w-6 h-7 rounded-full pointer-events-none animate-beacon z-15"
              style={{
                background:
                  'radial-gradient(circle, #ffffff 20%, rgba(230,235,245,0.9) 55%, transparent 75%)',
                filter:
                  'drop-shadow(0 0 16px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 35px rgba(255,255,255,0.8))',
              }}
              aria-hidden="true"
            />

            {/* Roaming Famous Sheet Ghosts in Castle Exterior (Michael Jackson, Princess Diana, Van Gogh, Mozart) */}
            <RoamingGhostRenderer
              scene="exterior"
              presence={Math.min(1, Math.max(0, 1 - (scrollProgress - 0.03) / 0.14))}
              onSelectGhost={setSelectedGhost}
            />

            {/* Ethereal Landing Typography */}
            <div
              ref={heroCardRef}
              className="absolute left-1/2 bottom-[14vh] -translate-x-1/2 w-[min(740px,90vw)] text-center z-20 pointer-events-auto"
            >
              <div className="flex items-center justify-center gap-2 mb-2 text-neutral-400">
                <span className="text-white text-xs">✦</span>
                <span className="text-[11px] tracking-[0.25em] uppercase text-neutral-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  Gothic Sanctuary
                </span>
                <span className="text-white text-xs">✦</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-normal text-white tracking-tight leading-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
                Where all tales come to an end…
              </h1>

              <p className="font-serif italic text-lg sm:text-2xl text-neutral-300 mt-2 font-normal drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                or perhaps, just the beginning.
              </p>

              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  onClick={() => scrollTo('dining')}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full border border-white/40 bg-black/60 hover:bg-white/20 text-white font-serif text-lg tracking-wide transition-all shadow-[0_0_30px_rgba(0,0,0,0.9)] hover:shadow-[0_0_35px_rgba(255,255,255,0.4)] backdrop-blur-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <span>Enter Castle</span>
                  <span aria-hidden="true">→</span>
                </button>
                <button
                  onClick={() => setIsRosterOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-neutral-700 bg-black/50 hover:bg-black/80 text-neutral-300 hover:text-white text-xs tracking-wider uppercase transition-colors backdrop-blur-md"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>View Roster</span>
                </button>
              </div>
            </div>

            {/* Scroll Indicator Prompt */}
            <div
              ref={scrollIndicatorRef}
              className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-neutral-400 pointer-events-none z-20"
            >
              <span className="text-[9px] tracking-[0.3em] uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                Scroll to Ascend
              </span>
              <div className="w-[1px] h-7 bg-gradient-to-b from-white/80 to-transparent" />
            </div>
          </div>

          {/* ========================================================
              ACT 2: THE HAUNTED DINING ROOM (MEET THE FAMOUS PEOPLE)
              ======================================================== */}
          <div
            ref={sceneDiningRef}
            className={`absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat scene-crisp grayscale contrast-[1.08] brightness-[0.98] z-20 transition-filter duration-700 ${
              isSpectralVision ? 'invert-[0.08] contrast-[1.25]' : ''
            }`}
            style={{
              backgroundImage: 'url("/static/img/dining.jpg")',
              transformOrigin: '51.5% 41.5%',
            }}
          >
            {/* The room without the table, faded in once visitors' ghosts join */}
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat pointer-events-none"
              style={{
                backgroundImage: 'url("/static/img/dining_empty.jpg")',
                opacity: crowd ? 1 : 0,
                transition: 'opacity 1600ms ease',
              }}
              aria-hidden="true"
            />

            {/* Candlelight Flicker Over Candelabras */}
            <div
              className="absolute left-[50.5%] top-[16%] -translate-x-1/2 -translate-y-1/2 w-64 h-40 rounded-full pointer-events-none animate-candle z-24 mix-blend-screen"
              style={{
                background:
                  'radial-gradient(ellipse, rgba(255, 255, 255, 0.25) 0%, rgba(200, 210, 225, 0.1) 50%, transparent 80%)',
              }}
              aria-hidden="true"
            />
            {!crowd && (
            <div
              className="absolute left-[50.5%] top-[68%] -translate-x-1/2 -translate-y-1/2 w-40 h-28 rounded-full pointer-events-none animate-candle z-24 mix-blend-screen"
              style={{
                background:
                  'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(210, 220, 235, 0.15) 40%, transparent 70%)',
              }}
              aria-hidden="true"
            />
            )}

            {/* Living Spirits Dynamic Canvas */}
            <LivingDiningSpirits visibility={scrollProgress > 0.2 && scrollProgress < 0.78 && !crowd ? 1 : 0} />

            {/* Section Heading */}
            <div
              ref={diningHeaderRef}
              className="absolute top-[8vh] left-1/2 -translate-x-1/2 text-center w-[min(880px,92vw)] pointer-events-none z-28 transition-opacity duration-500"
            >
              <h2 className="font-serif text-3xl sm:text-5xl font-normal text-white tracking-wide drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
                MEET THE FAMOUS PEOPLE
              </h2>
              <p className="font-serif italic text-base sm:text-xl text-neutral-300 mt-2 font-normal drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                Some legends never leave.
              </p>
            </div>

            {!crowd && (
              <>
            {/* 1. Cleopatra (Left) */}
            <button
              onClick={() => openSpiritByName('Cleopatra')}
              className="absolute left-[8%] top-[48%] w-[17%] h-[48%] rounded-2xl border border-transparent hover:border-white/70 hover:shadow-[0_0_35px_rgba(255,255,255,0.4)] transition-all cursor-pointer z-30 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Commune with Cleopatra"
            >
              <div className="absolute -top-11 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-lg bg-black/95 border border-white/50 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl text-white font-serif italic text-sm whitespace-nowrap">
                "I will not be triumphed over."
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/90 border border-neutral-700 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-neutral-200 text-xs whitespace-nowrap">
                ✦ Cleopatra VII
              </div>
            </button>

            {/* 2. Albert Einstein (Mid-Left) */}
            <button
              onClick={() => openSpiritByName('Albert Einstein')}
              className="absolute left-[31%] top-[48%] w-[16%] h-[48%] rounded-2xl border border-transparent hover:border-white/70 hover:shadow-[0_0_35px_rgba(255,255,255,0.4)] transition-all cursor-pointer z-30 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Commune with Albert Einstein"
            >
              <div className="absolute -top-11 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-lg bg-black/95 border border-white/50 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl text-white font-serif italic text-sm whitespace-nowrap">
                "Imagination is everything."
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/90 border border-neutral-700 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-neutral-200 text-xs whitespace-nowrap">
                ✦ Albert Einstein
              </div>
            </button>

            {/* 3. William Shakespeare (Center) */}
            <button
              onClick={() => openSpiritByName('William Shakespeare')}
              className="absolute left-[52%] top-[46%] w-[16%] h-[48%] rounded-2xl border border-transparent hover:border-white/70 hover:shadow-[0_0_35px_rgba(255,255,255,0.4)] transition-all cursor-pointer z-30 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Commune with William Shakespeare"
            >
              <div className="absolute -top-11 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-lg bg-black/95 border border-white/50 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl text-white font-serif italic text-sm whitespace-nowrap">
                "We are such stuff as dreams are made on."
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/90 border border-neutral-700 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-neutral-200 text-xs whitespace-nowrap">
                ✦ William Shakespeare
              </div>
            </button>

            {/* 4. Marie Curie (Mid-Right) */}
            <button
              onClick={() => openSpiritByName('Marie Curie')}
              className="absolute left-[68%] top-[48%] w-[14%] h-[48%] rounded-2xl border border-transparent hover:border-white/70 hover:shadow-[0_0_35px_rgba(255,255,255,0.4)] transition-all cursor-pointer z-30 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Commune with Marie Curie"
            >
              <div className="absolute -top-11 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-lg bg-black/95 border border-white/50 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl text-white font-serif italic text-sm whitespace-nowrap">
                "Be less curious about people and more about ideas."
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/90 border border-neutral-700 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-neutral-200 text-xs whitespace-nowrap">
                ✦ Marie Curie
              </div>
            </button>

            {/* 5. Nikola Tesla (Right) */}
            <button
              onClick={() => openSpiritByName('Nikola Tesla')}
              className="absolute left-[82%] top-[48%] w-[16%] h-[48%] rounded-2xl border border-transparent hover:border-white/70 hover:shadow-[0_0_35px_rgba(255,255,255,0.4)] transition-all cursor-pointer z-30 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Commune with Nikola Tesla"
            >
              <div className="absolute -top-11 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-lg bg-black/95 border border-white/50 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl text-white font-serif italic text-sm whitespace-nowrap">
                "The present is theirs; the future is mine."
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/90 border border-neutral-700 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-neutral-200 text-xs whitespace-nowrap">
                ✦ Nikola Tesla
              </div>
            </button>
              </>
            )}

            {/* Bottom Quick-Select Spirit Dock + Banquet Banter Button (Feature 1) */}
            <div
              ref={diningDockRef}
              className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-full border border-neutral-700 bg-black/75 backdrop-blur-xl z-30 pointer-events-auto transition-opacity"
            >
              {['Cleopatra', 'Albert Einstein', 'William Shakespeare', 'Marie Curie', 'Nikola Tesla'].map(
                (name) => (
                  <button
                    key={name}
                    onClick={() => openSpiritByName(name)}
                    className="px-3 py-1.5 rounded-full text-xs text-neutral-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-1 focus-visible:ring-white"
                  >
                    {name.split(' ')[0]}
                  </button>
                )
              )}

              <div className="h-4 w-[1px] bg-neutral-700 mx-1" aria-hidden="true" />

              {/* Private ghosts only appear when their maker asks for them */}
              {privateCount > 0 && (
                <button
                  onClick={() => {
                    ambientSound.playSpiritChime();
                    setShowMine((v) => !v);
                  }}
                  aria-pressed={showMine}
                  className={`px-3.5 py-1.5 rounded-full border text-xs tracking-wide transition-colors whitespace-nowrap ${
                    showMine
                      ? 'border-white/60 bg-white/20 text-white'
                      : 'border-neutral-600 bg-transparent text-neutral-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {showMine ? 'Hide my ghosts' : `My ghosts (${privateCount})`}
                </button>
              )}

              {/* Feature 1: Overhear Table Whispers Button */}
              <button
                onClick={() => {
                  ambientSound.playSpiritChime();
                  setIsBanterOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/40 bg-white/10 hover:bg-white/25 text-white text-xs font-serif italic tracking-wide transition-colors whitespace-nowrap"
              >
                <MessageSquareQuote className="w-3.5 h-3.5 text-white" />
                <span>Overhear Whispers</span>
              </button>
            </div>
          </div>

          {/* Ghosts made by visitors (e.g. Grandma Susie) hovering in the dining room */}
          <div
            ref={diningGhostsRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 25, display: 'none', transformOrigin: '51.5% 41.5%' }}
          >
            {crowd && (
              <DiningCrowd
                ghosts={ghosts}
                extras={dinerExtras}
                presence={Math.min(
                  Math.min(1, Math.max(0, (scrollProgress - 0.26) / 0.1)),
                  Math.min(1, Math.max(0, 1 - (scrollProgress - 0.6) / 0.12))
                )}
                onSelectGhost={setSelectedGhost}
              />
            )}
          </div>

          {/* ========================================================
              ACT 3: THE HAUNTED GRAVEYARD & INTERACTIVE MEMORIALS
              (Feature 2: Clickable Headstones & Flower Offerings)
              ======================================================== */}
          <div
            ref={sceneGraveyardRef}
            className={`absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat scene-crisp grayscale contrast-[1.12] brightness-[0.98] z-30 transition-filter duration-700 ${
              isSpectralVision ? 'invert-[0.08] contrast-[1.25]' : ''
            }`}
            style={{
              backgroundImage: 'url("/static/img/graveyard.jpg")',
              transformOrigin: '50% 50%',
            }}
          >
            {/* Ground Fog Atmosphere */}
            <div
              className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none opacity-25 mix-blend-screen"
              style={{
                backgroundImage:
                  'radial-gradient(ellipse at bottom, rgba(220,225,235,0.3) 0%, transparent 70%)',
              }}
            />

            {/* Roaming Famous Sheet Ghosts in Graveyard (Joan of Arc, Napoleon Bonaparte, Marilyn Monroe, Frida Kahlo) */}
            <RoamingGhostRenderer
              scene="graveyard"
              presence={Math.min(1, Math.max(0, (scrollProgress - 0.66) / 0.14))}
              onSelectGhost={setSelectedGhost}
            />

            {/* Feature 2: Interactive Headstones precisely aligned to the stones */}
            {memorials.map((mem) => (
              <button
                key={mem.id}
                onClick={() => {
                  ambientSound.playSpiritChime();
                  setSelectedMemorial(mem);
                }}
                className="absolute z-34 group cursor-pointer -translate-x-1/2 -translate-y-1/2 focus:outline-none transition-transform hover:scale-105"
                style={{
                  left: `${mem.x}%`,
                  top: `${mem.y}%`,
                  width: `${mem.width}%`,
                  height: `${mem.height}%`,
                }}
                aria-label={`Inspect ${mem.title}`}
              >
                {/* Outline hugging the stone's exact rounded arch shape */}
                <div className="w-full h-full rounded-t-[44%] rounded-b-md border border-transparent group-hover:border-white/60 group-hover:bg-white/5 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.35)] transition-all flex flex-col items-center justify-between p-2">
                  {/* Tooltip hovering above the headstone */}
                  <span className="text-[11px] text-white opacity-0 group-hover:opacity-100 transition-opacity font-serif whitespace-nowrap bg-black/95 px-2.5 py-1 rounded-md border border-neutral-700 shadow-xl -mt-8 pointer-events-none">
                    ✦ {mem.title}
                  </span>

                  {/* Spectral rose blooms right upon the gravestone */}
                  {mem.hasOfferedRose && (
                    <div className="flex items-center gap-1 bg-black/85 px-2 py-0.5 rounded-full border border-white/60 shadow-[0_0_15px_rgba(255,255,255,0.8)] mb-1">
                      <Flower2 className="w-3.5 h-3.5 text-white animate-pulse" />
                      <span className="text-[9px] text-white font-medium">Rose</span>
                    </div>
                  )}
                </div>
              </button>
            ))}

            {/* Final Discovery Panel */}
            <div
              ref={graveyardPanelRef}
              className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 w-[min(460px,88vw)] text-center p-5 sm:p-7 rounded-2xl border border-neutral-700/80 bg-black/80 backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,0.95)] z-38 pointer-events-auto transition-opacity duration-500"
            >
              <div className="flex items-center justify-center gap-1.5 mb-2 text-neutral-400">
                <span className="text-white text-xs">✦</span>
                <span className="text-[10px] tracking-[0.22em] uppercase text-neutral-300">
                  Beyond the Veil
                </span>
                <span className="text-white text-xs">✦</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-white tracking-tight leading-snug drop-shadow-[0_2px_16px_rgba(0,0,0,0.95)]">
                Didn't find who you were looking for?
              </h2>

              <p className="font-serif italic text-xs sm:text-sm text-neutral-300 mt-1.5 font-normal max-w-sm mx-auto leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                Not every soul has found its way into our gallery.
              </p>

              <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  onClick={() => setIsSummonOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full border border-white bg-white text-black font-medium text-xs tracking-wide transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:bg-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Search className="w-3.5 h-3.5 text-black" />
                  <span>Summon Spirit</span>
                </button>

                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full border border-neutral-700 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:text-white font-medium text-xs tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Heart className="w-3.5 h-3.5 text-white" />
                  <span>Remember Loved One</span>
                </button>
              </div>

              {/* Compact Roster trigger link */}
              <div className="mt-4 pt-3 border-t border-neutral-800">
                <button
                  onClick={() => setIsRosterOpen(true)}
                  className="text-[11px] text-neutral-400 hover:text-white transition-colors underline underline-offset-4 decoration-neutral-600 hover:decoration-white"
                >
                  Browse all {ghosts.length} sanctuary spirits →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invisible Tall Scroll Track that drives window.scrollY */}
      <div id="scroll-track" className="relative w-full h-[520vh] pointer-events-none" />

      {/* Modals & Dialogs */}
      <GhostProfileModal
        onReleased={(id) => setGhosts((prev) => prev.filter((g) => g.id !== id))}
        ghost={selectedGhost}
        onClose={() => setSelectedGhost(null)}
      />

      <SummonModal
        isOpen={isSummonOpen}
        onClose={() => setIsSummonOpen(false)}
        onGhostSummoned={(newGhost) => {
          // SummonModal has already turned their photo into a figure, so they appear complete
          const { portrait: _p, portraitUrl: _u, ...ghost } = newGhost;
          setGhosts((prev) => [ghost, ...prev.filter((g) => g.id !== ghost.id)]);
          setSelectedGhost(ghost);
        }}
      />

      <CreateGhostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onGhostCreated={(created) => {
          setGhosts((prev) => [created, ...prev]);
          if (created.isPrivate) setShowMine(true);
          setSelectedGhost(created);
        }}
      />

      <GalleryDrawer
        isOpen={isRosterOpen}
        onClose={() => setIsRosterOpen(false)}
        ghosts={ghosts}
        onSelectGhost={(ghost) => {
          setSelectedGhost(ghost);
          ambientSound.playSpiritChime();
        }}
        onOpenSummon={() => setIsSummonOpen(true)}
      />

      {/* Feature 1: Banquet Banter Dialog */}
      <BanquetBanterModal
        isOpen={isBanterOpen}
        onClose={() => setIsBanterOpen(false)}
      />

      {/* Feature 2: Graveyard Memorial Dialog */}
      <MemorialModal
        memorial={selectedMemorial}
        onClose={() => setSelectedMemorial(null)}
        onOfferRose={handleOfferRose}
      />
    </div>
  );
}
