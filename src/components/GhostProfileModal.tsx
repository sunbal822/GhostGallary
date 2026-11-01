import React, { useEffect, useState } from 'react';
import { GhostProfile } from '../types/ghost';
import { X, Sparkles, Quote, BookOpen, MessageCircle, Trash2 } from 'lucide-react';
import { getOwnerId } from '../utils/owner';
import { GhostChat } from './GhostChat';
import { GhostSprite } from './GhostSprite';
import { getLook } from '../data/looks';
import { PAINTED_FIVE } from './RoamingGhostRenderer';

interface Props {
  ghost: GhostProfile | null;
  onClose: () => void;
  onReleased?: (id: string) => void; // called after a ghost you made is deleted
}

export const GhostProfileModal: React.FC<Props> = ({ ghost, onClose, onReleased }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);
  useEffect(() => setConfirmRelease(false), [ghost?.id]);
  const release = async () => {
    if (!ghost) return;
    try {
      const res = await fetch(`/api/ghosts/${encodeURIComponent(ghost.id)}?owner=${encodeURIComponent(getOwnerId())}`, { method: 'DELETE' });
      if (res.ok) {
        onReleased?.(ghost.id);
        onClose();
      }
    } catch {
      /* leave the ghost where it is */
    }
  };
  useEffect(() => setChatOpen(false), [ghost?.id]);

  if (!ghost) return null;
  const firstName = ghost.name.split(' ')[0];
  const figure = ghost.figure ?? (PAINTED_FIVE.includes(ghost.id) ? `/static/img/figures/${ghost.id}.png` : undefined);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Profile of ${ghost.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-neutral-700/60 bg-gradient-to-b from-[#111317] via-[#090a0d] to-[#020204] p-6 sm:p-8 text-center shadow-[0_0_80px_rgba(0,0,0,0.95),0_0_40px_rgba(255,255,255,0.06)] text-[#f2f0fc]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1 min-w-0">
        {/* Supernatural Icon / Avatar (Monochrome) */}
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-900 border border-neutral-700/60 shadow-[0_0_30px_rgba(255,255,255,0.15)]">
          <Sparkles className="h-9 w-9 text-white animate-pulse" />
        </div>

        {/* Ghost Name */}
        <h3 className="font-serif text-3xl sm:text-4xl text-white tracking-wide font-normal">
          {ghost.name}
        </h3>

        {/* Category / Nutshell */}
        <p className="mt-2 text-sm sm:text-base font-medium text-neutral-300 tracking-wide">
          {ghost.nutshell}
        </p>

        {/* Category tag unboxed with subtle separator */}
        {ghost.category && (
          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-neutral-400">
            <BookOpen className="w-3.5 h-3.5 inline text-neutral-500" />
            <span>{ghost.category}</span>
            {ghost.isCustom && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-white">Personal Remembrance</span>
              </>
            )}
          </div>
        )}

        {chatOpen ? (
          <GhostChat key={ghost.id} ghost={ghost} />
        ) : (
          <>
        {/* Atmospheric Tale */}
        <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 text-left">
          <p className="text-sm leading-relaxed text-neutral-300">
            {ghost.tale}
          </p>
        </div>

        {/* Epitaph / Famous Quote (Monochrome silver) */}
        {ghost.epitaph && (
          <div className="mt-5 flex items-start justify-center gap-2 text-center">
            <Quote className="w-4 h-4 text-neutral-400 shrink-0 mt-1" />
            <p className="font-serif italic text-base sm:text-lg text-neutral-200 leading-snug">
              "{ghost.epitaph}"
            </p>
          </div>
        )}

        {ghost.quote && ghost.quote !== ghost.epitaph && (
          <p className="mt-2 text-xs text-neutral-400 italic">
            "{ghost.quote}"
          </p>
        )}

          </>
        )}

        {/* Action Button */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setChatOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/50 bg-white/10 text-sm font-medium text-white hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
          >
            <MessageCircle className="w-4 h-4" />
            {chatOpen ? 'Back to their story' : `Speak with ${firstName}`}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full border border-neutral-600 bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 hover:border-neutral-400 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
          >
            Leave in Peace
          </button>
          {ghost.isCustom && ghost.isPrivate !== undefined && (
            confirmRelease ? (
              <button
                onClick={release}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-red-400/60 bg-red-500/10 text-sm text-red-200 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Yes, release {firstName} for good
              </button>
            ) : (
              <button
                onClick={() => setConfirmRelease(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm text-neutral-400 hover:text-white transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Release this ghost
              </button>
            )
          )}
        </div>
          </div>
          {/* The ghost itself, hovering beside its story */}
          <div className="relative sm:w-[260px] shrink-0 flex items-center justify-center min-h-[170px]" aria-hidden="true">
            <div className="absolute inset-0 rounded-full opacity-60" style={{ background: 'radial-gradient(circle, rgba(200,215,240,0.14) 0%, transparent 65%)' }} />
            {figure ? (
              <img src={figure} alt="" draggable={false} className="animate-ghost-bob max-w-full" style={{ height: '320px', width: 'auto', filter: `drop-shadow(0 0 16px ${getLook(ghost).aura}88)` }} />
            ) : (
              <GhostSprite look={getLook(ghost)} width="260px" className="animate-ghost-bob max-w-full" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
