import React from 'react';
import { GraveyardMemorial } from '../types/ghost';
import { X, Sparkles, Flower2, Quote } from 'lucide-react';
import { ambientSound } from '../utils/audio';

interface Props {
  memorial: GraveyardMemorial | null;
  onClose: () => void;
  onOfferRose: (id: string) => void;
}

export const MemorialModal: React.FC<Props> = ({ memorial, onClose, onOfferRose }) => {
  if (!memorial) return null;

  const handleOffer = () => {
    ambientSound.playSpiritChime();
    onOfferRose(memorial.id);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Memorial of ${memorial.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-neutral-700/80 bg-gradient-to-b from-[#13151b] via-[#090a0d] to-[#020204] p-6 sm:p-8 text-center text-[#f2f0fc] shadow-[0_0_80px_rgba(0,0,0,0.95),0_0_40px_rgba(255,255,255,0.06)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Headstone Stone Icon */}
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-700/80 shadow-[0_0_25px_rgba(255,255,255,0.1)]">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        <div className="text-[10px] tracking-[0.25em] uppercase text-neutral-400 mb-1">
          Ancient Headstone · {memorial.era}
        </div>

        <h3 className="font-serif text-2xl sm:text-3xl font-normal text-white">
          {memorial.title}
        </h3>

        {/* Poetic Epitaph */}
        <div className="mt-5 p-4 rounded-xl border border-neutral-800 bg-black/60 text-center">
          <Quote className="w-4 h-4 text-neutral-500 mx-auto mb-1.5" />
          <p className="font-serif italic text-base sm:text-lg text-neutral-200 leading-snug">
            "{memorial.epitaph}"
          </p>
        </div>

        {/* Reflection */}
        <p className="text-xs text-neutral-400 mt-4 leading-relaxed text-left pl-3 border-l-2 border-neutral-700">
          {memorial.reflection}
        </p>

        {/* Action: Leave a Ghostly White Rose */}
        <div className="mt-6 flex flex-col items-center gap-2">
          {memorial.hasOfferedRose ? (
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-neutral-600 bg-neutral-900 text-xs text-neutral-200 font-medium">
              <Flower2 className="w-4 h-4 text-white animate-pulse" />
              <span>A Spectral Rose blooms upon this stone</span>
            </div>
          ) : (
            <button
              onClick={handleOffer}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-white bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Flower2 className="w-4 h-4 text-black" />
              <span>Offer a Ghostly White Rose</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
