// Speech-to-text that runs entirely in the browser (OpenAI's open-source Whisper, via Transformers.js).
// The model is downloaded once and cached by the browser; after that it works offline and audio never leaves the device.
import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;

const MODEL = 'onnx-community/whisper-base'; // multilingual; swap for 'onnx-community/whisper-small' for more accuracy

let asr: any = null;
const send = (msg: Record<string, unknown>) => (self as any).postMessage(msg);

self.onmessage = async (e: MessageEvent<{ id: number; audio: Float32Array }>) => {
  const { id, audio } = e.data;
  try {
    if (!asr) {
      asr = await pipeline('automatic-speech-recognition', MODEL, {
        device: 'wasm',
        dtype: 'q8',
        progress_callback: (p: any) => {
          if (p?.status === 'progress' && typeof p.progress === 'number') send({ id, type: 'progress', progress: p.progress });
        },
      });
    }
    send({ id, type: 'working' });
    const out: any = await asr(audio, { chunk_length_s: 30, stride_length_s: 5, task: 'transcribe' });
    send({ id, type: 'done', text: (Array.isArray(out) ? out.map((o) => o.text).join(' ') : out.text || '').trim() });
  } catch (err) {
    send({ id, type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
};
