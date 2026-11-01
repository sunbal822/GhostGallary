import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { startRecording, transcribe, MAX_RECORD_SECONDS, Recording } from '../utils/voice';

interface Props {
  onText: (text: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  /** 'icon' is a round button (chat); 'pill' shows words (forms). */
  variant?: 'icon' | 'pill';
  idleLabel?: string;
}

/** Tap to start recording, tap again to stop. The recording is written down and handed to onText. */
export const MicButton: React.FC<Props> = ({ onText, onError, disabled, variant = 'icon', idleLabel = 'Speak' }) => {
  const [state, setState] = useState<'idle' | 'recording' | 'working'>('idle');
  const [secs, setSecs] = useState(0);
  const [dl, setDl] = useState<number | null>(null); // first-use model download progress
  const rec = useRef<Recording | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const started = useRef(0);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      window.clearInterval(timer.current);
      rec.current?.cancel();
    };
  }, []);

  const finish = async () => {
    const r = rec.current;
    rec.current = null;
    window.clearInterval(timer.current);
    if (!r) return;
    setState('working');
    try {
      const text = await transcribe(await r.stop(), (p) => alive.current && setDl(p));
      if (!alive.current) return;
      if (text) onText(text);
      else onError?.("I couldn't hear anything. Try again a little closer to the microphone.");
    } catch (err) {
      if (alive.current) onError?.(err instanceof Error ? err.message : 'Voice did not work. Please try again.');
    } finally {
      if (alive.current) {
        setState('idle');
        setDl(null);
      }
    }
  };

  const begin = async () => {
    try {
      rec.current = await startRecording();
      started.current = Date.now();
      setSecs(0);
      setState('recording');
      timer.current = window.setInterval(() => {
        const s = Math.floor((Date.now() - started.current) / 1000);
        setSecs(s);
        if (s >= MAX_RECORD_SECONDS) void finish();
      }, 400);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Could not start the microphone.');
    }
  };

  const onClick = () => {
    if (state === 'idle') void begin();
    else if (state === 'recording') void finish();
  };

  const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const label = state === 'recording' ? `Stop · ${clock}` : state === 'working' ? (dl !== null && dl < 100 ? `Loading voice model… ${dl}%` : 'Writing it down…') : idleLabel;
  const Icon = state === 'recording' ? Square : state === 'working' ? Loader2 : Mic;
  const iconCls = `w-4 h-4 ${state === 'working' ? 'animate-spin' : ''} ${state === 'recording' ? 'fill-current' : ''}`;
  const aria = state === 'recording' ? 'Stop recording' : state === 'working' ? 'Writing down your voice' : 'Record a voice message';

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || state === 'working'}
        aria-label={aria}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-40 ${
          state === 'recording'
            ? 'border-red-400/70 bg-red-500/15 text-red-100 animate-pulse'
            : 'border-neutral-600 bg-neutral-900 text-neutral-200 hover:border-white hover:text-white'
        }`}
      >
        <Icon className={iconCls} /> {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || state === 'working'}
      aria-label={aria}
      title={label}
      className={`flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border text-white transition-colors disabled:opacity-40 ${
        state === 'recording'
          ? 'border-red-400/70 bg-red-500/20 px-3 animate-pulse'
          : 'w-10 border-neutral-600 bg-neutral-900 hover:bg-neutral-800'
      }`}
    >
      <Icon className={iconCls} />
      {state === 'recording' && <span className="text-xs tabular-nums">{clock}</span>}
    </button>
  );
};
