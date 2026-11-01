import React, { useState } from 'react';
import { Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';
import { ambientSound } from '../utils/audio';

interface Props {
  onScrollTo: (target: 'top' | 'dining' | 'graveyard') => void;
  onOpenRoster: () => void;
  onOpenSummon: () => void;
  isSpectralVision: boolean;
  onToggleSpectralVision: () => void;
}

export const Navigation: React.FC<Props> = ({
  onScrollTo,
  onOpenRoster,
  isSpectralVision,
  onToggleSpectralVision,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const toggleAudio = () => {
    const state = ambientSound.toggle();
    setIsPlayingAudio(state);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-6 px-6 sm:px-10 py-5 bg-gradient-to-b from-black/95 via-black/50 to-transparent pointer-events-auto">
      {/* Zone 1: Single text element wordmark */}
      <button
        onClick={() => onScrollTo('top')}
        className="flex items-center gap-2.5 text-left text-white tracking-wide font-serif text-xl sm:text-2xl whitespace-nowrap shrink-0 group focus:outline-none"
      >
        <span
          className="inline-block w-4 h-5 bg-gradient-to-br from-white via-neutral-300 to-neutral-500 opacity-90 group-hover:opacity-100 transition-opacity"
          style={{
            clipPath:
              'path("M8 0C2.5 0 0.5 4.5 0.5 9v11l3-3 2.5 3 2.5-3 2.5 3 3-3V9C15.5 4.5 13.5 0 8 0Z")',
            filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))',
          }}
          aria-hidden="true"
        />
        <span className="text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
          Ghost Gallery
        </span>
      </button>

      {/* Zone 2: 4 concise single-line text navigation links */}
      <nav
        className="hidden md:flex items-center gap-7 text-xs tracking-widest uppercase font-medium text-neutral-300"
        aria-label="Scene Navigation"
      >
        <button
          onClick={() => onScrollTo('top')}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 focus:outline-none hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]"
        >
          Exterior
        </button>
        <button
          onClick={() => onScrollTo('dining')}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 focus:outline-none hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]"
        >
          The Banquet
        </button>
        <button
          onClick={() => onScrollTo('graveyard')}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 focus:outline-none hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]"
        >
          Graveyard
        </button>
        <button
          onClick={onOpenRoster}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 focus:outline-none hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]"
        >
          Roster
        </button>
      </nav>

      {/* Zone 3: Actions (Spectral Vision & Audio) */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Spectral Vision Mode Toggle */}
        <button
          onClick={onToggleSpectralVision}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium tracking-wide transition-all ${
            isSpectralVision
              ? 'border-white bg-white text-black shadow-[0_0_18px_rgba(255,255,255,0.4)]'
              : 'border-neutral-700/80 bg-black/60 text-neutral-300 hover:text-white hover:border-neutral-400'
          }`}
          title={isSpectralVision ? 'Disable Spectral Vision [V]' : 'Enable Spectral Vision [V]'}
          aria-label="Toggle Spectral Vision"
        >
          {isSpectralVision ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ghost Sight On</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Ghost Sight</span>
            </>
          )}
        </button>

        {/* Ambient Sound Toggle */}
        <button
          onClick={toggleAudio}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium tracking-wide transition-all ${
            isPlayingAudio
              ? 'border-white/80 bg-white/15 text-white shadow-[0_0_15px_rgba(255,255,255,0.25)]'
              : 'border-neutral-700/80 bg-black/60 text-neutral-300 hover:text-white hover:border-neutral-400'
          }`}
          title={isPlayingAudio ? 'Mute Atmosphere' : 'Enable Atmosphere'}
          aria-label={isPlayingAudio ? 'Mute Ambient Audio' : 'Unmute Ambient Audio'}
        >
          {isPlayingAudio ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-white animate-pulse" />
              <span className="hidden sm:inline">Atmosphere</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Atmosphere</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
