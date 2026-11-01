import React, { useState } from 'react';
import { BanquetDialogue } from '../types/ghost';
import { BANQUET_DIALOGUES } from '../data/dialogues';
import { X, ChevronLeft, ChevronRight, MessageSquareQuote, Sparkles } from 'lucide-react';
import { ambientSound } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const BanquetBanterModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen) return null;

  const current = BANQUET_DIALOGUES[currentIndex];

  const handleNext = () => {
    ambientSound.playSpiritChime();
    setCurrentIndex((prev) => (prev + 1) % BANQUET_DIALOGUES.length);
  };

  const handlePrev = () => {
    ambientSound.playSpiritChime();
    setCurrentIndex((prev) => (prev - 1 + BANQUET_DIALOGUES.length) % BANQUET_DIALOGUES.length);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Overhear Midnight Banquet Whispers"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-neutral-700/80 bg-gradient-to-b from-[#12141a] via-[#090a0d] to-[#020204] p-6 sm:p-8 text-[#f2f0fc] shadow-[0_0_80px_rgba(0,0,0,0.95),0_0_40px_rgba(255,255,255,0.06)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-2 text-neutral-400">
          <MessageSquareQuote className="w-4 h-4 text-white" />
          <span className="text-[11px] tracking-[0.25em] uppercase text-neutral-300">
            Midnight Table Whispers
          </span>
          <span className="text-xs text-neutral-500">·</span>
          <span className="text-xs text-neutral-400">
            {currentIndex + 1} of {BANQUET_DIALOGUES.length}
          </span>
        </div>

        <h3 className="font-serif text-2xl sm:text-3xl font-normal text-white">
          {current.topic}
        </h3>
        <p className="text-xs text-neutral-400 mt-1">
          Between <span className="text-white font-medium">{current.speakers[0]}</span> and{' '}
          <span className="text-white font-medium">{current.speakers[1]}</span>
        </p>

        {/* Dialogue Script */}
        <div className="mt-6 space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          {current.dialogue.map((line, idx) => {
            const isSpeakerA = line.speaker === current.speakers[0];
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${
                  isSpeakerA
                    ? 'border-neutral-800 bg-neutral-900/60'
                    : 'border-neutral-750 bg-black/60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-3 h-3 text-neutral-400" />
                  <span className="text-xs font-serif tracking-wider font-semibold text-white">
                    {line.speaker}
                  </span>
                </div>
                <p className="font-serif italic text-sm sm:text-base text-neutral-300 leading-relaxed pl-5 border-l border-neutral-700">
                  "{line.text}"
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer Navigation */}
        <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between">
          <button
            onClick={handlePrev}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-neutral-700 bg-neutral-900/70 text-xs font-medium text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Whisper</span>
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-neutral-600 bg-white text-black text-xs font-medium hover:bg-neutral-200 transition-colors"
          >
            <span>Next Conversation</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
