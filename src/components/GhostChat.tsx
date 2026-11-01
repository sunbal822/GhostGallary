import React, { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Mic } from 'lucide-react';
import { MicButton } from './MicButton';
import { GhostProfile } from '../types/ghost';
import { getOwnerId } from '../utils/owner';

interface Turn {
  role: 'user' | 'ghost';
  text: string;
  voice?: boolean; // the visitor spoke this one
}

/** A small conversation with one ghost, answered in character by the local AI model. */
export const GhostChat: React.FC<{ ghost: GhostProfile }> = ({ ghost }) => {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const first = ghost.name.split(' ')[0];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns, busy]);

  const sendText = async (raw: string, voice = false) => {
    const text = raw.trim().slice(0, 600);
    if (!text || busy) return;
    setVoiceError(null);
    const next: Turn[] = [...turns, { role: 'user', text, voice }];
    setTurns(next);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ghostId: ghost.id, ownerId: getOwnerId(), messages: next.map(({ role, text }) => ({ role, text })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'The spirit did not answer');
      setTurns([...next, { role: 'ghost', text: data.reply }]);
    } catch (err) {
      setTurns([
        ...next,
        { role: 'ghost', text: `*${first} flickers and fades for a moment.* ${err instanceof Error ? err.message : 'Please try again.'}` },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    void sendText(input);
  };

  return (
    <div className="mt-5 flex flex-col text-left">
      <div className="h-56 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-950/80 p-3 space-y-3" aria-live="polite">
        {turns.length === 0 && (
          <p className="text-sm text-neutral-500 italic">
            {first} is listening. Say hello, type, or tap the mic and speak.
          </p>
        )}
        {turns.map((t, i) => (
          <div key={i} className={t.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <p
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                t.role === 'user'
                  ? 'bg-white/10 text-white'
                  : 'border border-neutral-700 bg-black/60 text-neutral-200 font-serif italic'
              }`}
            >
              {t.voice && <Mic className="mr-1.5 inline h-3 w-3 -mt-0.5 text-neutral-400" aria-label="Voice message" />}
              {t.text}
            </p>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <p className="rounded-2xl border border-neutral-700 bg-black/60 px-3.5 py-2 text-sm text-neutral-400 inline-flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> {first} is gathering a thought…
            </p>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="mt-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Speak to ${first}…`}
          maxLength={600}
          className="flex-1 rounded-full border border-neutral-700 bg-black/70 px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white"
          aria-label={`Message to ${ghost.name}`}
        />
        <MicButton onText={(t) => void sendText(t, true)} onError={setVoiceError} disabled={busy} />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-600 bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-40 transition-colors"
          aria-label="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
      {voiceError && <p className="mt-2 text-xs text-neutral-300">{voiceError}</p>}
    </div>
  );
};
