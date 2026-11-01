import React, { useState } from 'react';
import { getOwnerId } from '../utils/owner';
import { ghostify } from '../utils/ghostify';
import { GhostProfile } from '../types/ghost';
import { X, Heart, Loader2, ImagePlus } from 'lucide-react';
import { ambientSound } from '../utils/audio';
import { MicButton } from './MicButton';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGhostCreated: (ghost: GhostProfile) => void;
}

// Shrink the photo and pick a clothing colour from the lower-middle of the picture.
export async function prepPhoto(file: File): Promise<{ photo: string; outfit: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error('Could not read that photo'));
      im.src = url;
    });
    const scale = Math.min(1, 512 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, c.width, c.height);
    // keep PNGs as PNG so a photo that is already cut out keeps its transparency
    const photo = file.type === 'image/png' ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.82);

    // clothing colour: most common saturated colour in the lower-centre of the photo
    const x0 = Math.floor(c.width * 0.25), x1 = Math.floor(c.width * 0.75);
    const y0 = Math.floor(c.height * 0.55), y1 = Math.floor(c.height * 0.92);
    const data = ctx.getImageData(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0)).data;
    const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx < 40 || mn > 225 || mx - mn < 28) continue; // skip near black, near white, greys
      const key = `${r >> 6}-${g >> 6}-${b >> 6}`;
      const e = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
      e.n++; e.r += r; e.g += g; e.b += b;
      buckets.set(key, e);
    }
    type Bucket = { n: number; r: number; g: number; b: number };
    let best = null as Bucket | null;
    for (const e of buckets.values()) if (!best || e.n > best.n) best = e;
    const hex = (v: number) => Math.round(v).toString(16).padStart(2, '0');
    const outfit = best ? `#${hex(best.r / best.n)}${hex(best.g / best.n)}${hex(best.b / best.n)}` : '#9fb0cf';
    return { photo, outfit };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const CreateGhostModal: React.FC<Props> = ({ isOpen, onClose, onGhostCreated }) => {
  const [name, setName] = useState('');
  const [story, setStory] = useState('');
  const [epitaph, setEpitaph] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addTo = (set: React.Dispatch<React.SetStateAction<string>>) => (t: string) => {
    setError(null);
    set((cur) => (cur.trim() ? `${cur.trimEnd()} ${t}` : t));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!file) {
      setError('A photo is needed so we can turn them into a ghost.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { photo, outfit } = await prepPhoto(file);
      let figure: string;
      try {
        figure = await ghostify(photo);
      } catch (err) {
        throw new Error(
          `We couldn't turn that photo into a silhouette (${err instanceof Error ? err.message : 'unknown error'}). Try a clearer photo of just them.`
        );
      }
      const res = await fetch('/api/ghosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          story: story.trim() || undefined,
          epitaph: epitaph.trim() || undefined,
          photo,
          figure,
          outfit,
          ownerId: getOwnerId(),
          isPublic,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to record memorial spirit');
      }

      const ghost: GhostProfile = await res.json();
      ambientSound.playSpiritChime();
      onGhostCreated(ghost);
      setName('');
      setStory('');
      setEpitaph('');
      setFile(null);
      setPreview(null);
      setIsPublic(false);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not enshrine memory. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create your own ghost"
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
          <Heart className="h-7 w-7 text-white" />
        </div>

        <h3 className="font-serif text-2xl sm:text-3xl font-normal text-white">
          Summon Someone You Loved
        </h3>
        <p className="mt-2 text-sm text-neutral-400 max-w-sm mx-auto">
          Give your spirit a name and a cherished memory. They will join the eternal halls and remember you.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 text-left">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-medium text-neutral-400">Spirit's Name *</label>
              <MicButton variant="pill" idleLabel="Say it" disabled={isLoading} onText={(t) => { setError(null); setName(t.replace(/[.!?]+$/, '')); }} onError={setError} />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grandma Rose, or a beloved companion"
              required
              disabled={isLoading}
              className="w-full rounded-xl border border-neutral-700 bg-black/60 px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-white focus:ring-1 focus:ring-white"
              autoFocus
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-medium text-neutral-400">A Cherished Memory or Story</label>
              <MicButton variant="pill" idleLabel="Tell it by voice" disabled={isLoading} onText={addTo(setStory)} onError={setError} />
            </div>
            <textarea
              rows={3}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="What made them smile, what they loved, or how they wander..."
              disabled={isLoading}
              className="w-full rounded-xl border border-neutral-700 bg-black/60 px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-white focus:ring-1 focus:ring-white"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-medium text-neutral-400">Parting Words / Epitaph (Optional)</label>
              <MicButton variant="pill" idleLabel="Say it" disabled={isLoading} onText={addTo(setEpitaph)} onError={setError} />
            </div>
            <input
              type="text"
              value={epitaph}
              onChange={(e) => setEpitaph(e.target.value)}
              placeholder='e.g. "Forever in our songs and memories."'
              disabled={isLoading}
              className="w-full rounded-xl border border-neutral-700 bg-black/60 px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-white focus:ring-1 focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Their Photo * (we turn it into their ghost)
            </label>
            <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-dashed border-neutral-600 bg-black/60 px-4 py-3 text-sm text-neutral-300 hover:border-white transition-colors">
              {preview ? (
                <img src={preview} alt="" className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <ImagePlus className="h-5 w-5 text-neutral-400" />
              )}
              <span>{file ? file.name : 'Choose a photo of them'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isLoading}
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFile(f);
                  setPreview(f ? URL.createObjectURL(f) : null);
                  setError(null);
                }}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} disabled={isLoading} />
            <span>Let other visitors meet this ghost (otherwise only you can see it)</span>
          </label>

          <button
            type="submit"
            disabled={isLoading || !name.trim() || !file}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-white text-black px-5 py-3 text-sm font-semibold hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.25)]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Cutting them out of the photo… (the first time downloads the AI model, so it can take a minute)</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4" />
                <span>Enshrine Spirit in Gallery</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <p className="mt-3 text-xs text-neutral-300 bg-neutral-900 border border-neutral-700 rounded-lg p-2.5">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
