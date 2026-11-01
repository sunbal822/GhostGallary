// Record from the microphone and write it down with Whisper running locally in the browser.

export const MAX_RECORD_SECONDS = 90;

export function voiceSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
}

export interface Recording {
  stop(): Promise<Blob>;
  cancel(): void;
}

export async function startRecording(): Promise<Recording> {
  if (!voiceSupported()) {
    throw new Error('Voice needs a secure page (https or localhost) and a browser with microphone support.');
  }
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  } catch (err) {
    const name = err instanceof DOMException ? err.name : '';
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      throw new Error('The microphone is blocked. Allow it in the address bar, then try again.');
    }
    if (name === 'NotFoundError') throw new Error('No microphone was found on this device.');
    throw new Error('Could not start the microphone.');
  }

  const rec = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  const release = () => stream.getTracks().forEach((t) => t.stop());
  rec.start();

  return {
    stop: () =>
      new Promise<Blob>((resolve) => {
        const done = () => {
          release();
          resolve(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
        };
        if (rec.state === 'inactive') return done();
        rec.onstop = done;
        rec.stop();
      }),
    cancel: () => {
      rec.onstop = null;
      try {
        if (rec.state !== 'inactive') rec.stop();
      } catch {
        /* already stopped */
      }
      release();
    },
  };
}

/** Decode a recording into 16 kHz mono samples, which is what Whisper wants. */
async function blobToPcm16k(blob: Blob): Promise<Float32Array> {
  const Ctx: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new Ctx();
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
  } finally {
    ctx.close?.();
  }
  if (decoded.duration < 0.4) throw new Error('That was too short. Hold on a little longer while you speak.');

  const rate = 16000;
  const off = new OfflineAudioContext(1, Math.max(1, Math.ceil(decoded.duration * rate)), rate);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start();
  return (await off.startRendering()).getChannelData(0).slice();
}

// One shared worker runs Whisper off the main thread so the page stays smooth.
let worker: Worker | null = null;
let nextId = 1;

/**
 * Turns a recording into text, fully on this device (open-source Whisper in the browser).
 * The first time, the model (~80 MB) is downloaded and cached; onProgress reports 0-100 while that happens.
 * Resolves to '' if nothing was heard.
 */
export async function transcribe(recording: Blob, onProgress?: (percent: number) => void): Promise<string> {
  let pcm: Float32Array;
  try {
    pcm = await blobToPcm16k(recording);
  } catch (err) {
    throw err instanceof Error && err.message.startsWith('That was too short')
      ? err
      : new Error('This browser could not process the recording. Try Chrome, Edge or Safari.');
  }

  if (!worker) worker = new Worker(new URL('./whisper.worker.ts', import.meta.url), { type: 'module' });
  const w = worker;
  const id = nextId++;
  return new Promise<string>((resolve, reject) => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.id !== id) return;
      if (e.data.type === 'progress') onProgress?.(Math.round(e.data.progress));
      else if (e.data.type === 'done') {
        w.removeEventListener('message', onMsg);
        resolve(String(e.data.text || '').trim());
      } else if (e.data.type === 'error') {
        w.removeEventListener('message', onMsg);
        reject(new Error('The voice model could not run here (the first use needs an internet connection to download it).'));
      }
    };
    w.addEventListener('message', onMsg);
    w.postMessage({ id, audio: pcm }, [pcm.buffer]);
  });
}
