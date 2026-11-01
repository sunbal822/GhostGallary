import React, { useState } from 'react';
import { GhostProfile } from '../types/ghost';
import { X, Search, Sparkles, Plus } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ghosts: GhostProfile[];
  onSelectGhost: (ghost: GhostProfile) => void;
  onOpenSummon: () => void;
}

export const GalleryDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  ghosts,
  onSelectGhost,
  onOpenSummon,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = ghosts.filter(
    (g) =>
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.nutshell.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.category && g.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Spirits Gallery"
      className="fixed inset-0 z-50 flex justify-end bg-black/85 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-[#08090c] border-l border-neutral-800 p-6 flex flex-col shadow-2xl text-[#f2f0fc]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h3 className="font-serif text-2xl font-normal text-white">The Spirit Roster</h3>
            <p className="text-xs text-neutral-400">All wandering souls recorded in the sanctuary</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-full transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search spirits by name or discipline..."
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-neutral-400"
          />
        </div>

        {/* List */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-xs">
              No spirits match your search.
            </div>
          ) : (
            filtered.map((ghost) => (
              <button
                key={ghost.id}
                onClick={() => {
                  onSelectGhost(ghost);
                  onClose();
                }}
                className="w-full text-left p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 hover:border-neutral-600 transition-all flex items-start gap-3 group focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
              >
                <div className="h-9 w-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-white transition-colors">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-serif text-base text-white truncate font-normal group-hover:text-neutral-200 transition-colors">
                      {ghost.name}
                    </h4>
                    {ghost.category && (
                      <span className="text-[10px] text-neutral-500 shrink-0">
                        {ghost.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                    {ghost.nutshell}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-neutral-800 flex gap-2">
          <button
            onClick={() => {
              onClose();
              onOpenSummon();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-700 bg-neutral-900 text-xs font-medium text-white hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Summon Another Spirit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
