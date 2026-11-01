import React, { useState } from 'react';
import { GhostProfile } from '../types/ghost';
import { X, Sparkles, Loader2, Search, ImagePlus } from 'lucide-react';
import { ambientSound } from '../utils/audio';
import { ghostify } from '../utils/ghostify';
import { prepPhoto } from './CreateGhostModal';

// The server tries to download their photo; if it couldn't, the browser has a go itself.
async function urlToDataUrl(url?: string): Promise<string | undefined> {
  if (!url) return undefined;
  try {
    const r = await fetch(url);
    if (!r.ok) return undefined;
    const blob = await r.blob();
    return await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

async function saveFigure(id: string, figure: string) {
  try {
    await fetch(`/api/ghosts/${encodeURIComponent(id)}/figure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ figure }),
    });
  } catch {
    /* the figure still shows this visit */
  }
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGhostSummoned: (ghost: GhostProfile) => void;
}

export const SummonModal: React.FC<Props> = ({ isOpen, onClose, onGhostSummoned }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState('');
  // summoned, but no usable photo was found: wait for the visitor to add one
  const [needsPhoto, setNeedsPhoto] = useState<GhostProfile | null>(null);

  if (!isOpen) return null;

  const finish = (ghost: GhostProfile) => {
    ambientSound.playSpiritChime();
    onGhostSummoned(ghost);
    setQuery('');
    setNeedsPhoto(null);
    setError(null);
    onClose();
  };

  const handleOwnPhoto = async (file: File | undefined) => {
    if (!file || !needsPhoto) return;
    setIsLoading(true);
    setError(null);
    setStage('Giving them form…');
    try {
      const { photo } = await prepPhoto(file);
      const figure = await ghostify(photo);
      await saveFigure(needsPhoto.id, figure);
      finish({ ...needsPhoto, figure });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That photo did not work. Try another one.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setNeedsPhoto(null);
    setStage('Summoning from beyond the veil...');

    try {
      const res = await fetch('/api/summon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: query.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to summon ghost from beyond');
      }

      const { portrait, portraitUrl, ...ghost }: GhostProfile = await res.json();

      // Wait for their real figure so they arrive as themselves, not as the plain placeholder ghost
      let figure = ghost.figure;
      if (!figure) {
        setStage('Giving them form…');
        const src = portrait || (await urlToDataUrl(portraitUrl));
        if (src) {
          try {
            const small = await prepPhoto(await (await fetch(src)).blob() as File);
            figure = await ghostify(small.photo);
          } catch (err) {
            console.warn('Could not make a figure for', ghost.name, err);
          }
        }
        if (figure) await saveFigure(ghost.id, figure);
      }

      if (figure) {
        finish({ ...ghost, figure });
      } else {
        setNeedsPhoto(ghost);
        setError(`${ghost.name} answered the call, but I couldn't find a usable photo of them. Add one and I'll give them their form.`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'The spirits remained silent. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = ['Edgar Allan Poe', 'Ada Lovelace', 'Leonardo da Vinci', 'Beethoven', 'Hypatia'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Summon Famous Ghost"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-700/60 bg-gradient-to-b from-[#111317] via-[#090a0d] to-[#020204] p-6 sm:p-8 text-center shadow-[0_0_80px_rgba(0,0,0,0.95),0_0_40px_rgba(255,255,255,0.06)] text-[#f2f0fc]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 border border-neutral-700/60">
          <Sparkles className="h-7 w-7 text-white" />
        </div>

        <h3 className="font-serif text-2xl sm:text-3xl font-normal text-white">
          Summon a Famous Spirit
        </h3>
        <p className="mt-2 text-sm text-neutral-400 max-w-sm mx-auto">
          Call upon any luminary of history, literature, or art. If their memory lingers, our portal will summon them to the banquet table.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Edgar Allan Poe, Ada Lovelace, Beethoven..."
              disabled={isLoading}
              className="w-full rounded-xl border border-neutral-700 bg-black/60 pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-white text-black px-5 py-3 text-sm font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.25)]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>{stage || 'Summoning from beyond the veil...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Summon Spirit</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <p className="mt-3 text-xs text-neutral-300 bg-neutral-900 border border-neutral-700 rounded-lg p-2.5">
            {error}
          </p>
        )}

        {needsPhoto && (
          <div className="mt-3 flex flex-col gap-2">
            <label className="flex items-center justify-center gap-2 cursor-pointer rounded-xl border border-dashed border-neutral-600 bg-black/60 px-4 py-3 text-sm text-neutral-300 hover:border-white transition-colors">
              <ImagePlus className="h-5 w-5 text-neutral-400" />
              <span>Choose a photo of {needsPhoto.name.split(' ')[0]}</span>
              <input type="file" accept="image/*" className="hidden" disabled={isLoading} onChange={(e) => void handleOwnPhoto(e.target.files?.[0])} />
            </label>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => finish(needsPhoto)}
              className="text-xs text-neutral-400 hover:text-white underline underline-offset-2"
            >
              Summon them without a photo
            </button>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-neutral-800">
          <p className="text-xs text-neutral-400 mb-2">Or choose a historical legend:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setQuery(name)}
                className="text-xs text-neutral-300 bg-neutral-900 hover:bg-neutral-800 hover:text-white border border-neutral-700 rounded-full px-3 py-1 transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
