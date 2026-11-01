import { GhostProfile, parseProfileStrict, parseProfileLenient } from "./ghostSchema";
import type { Message } from "./prompts";

// One client for both modes. Ollama exposes an OpenAI-compatible API at /v1,
// and most hosted open-weight providers do too, so only env vars change.
//   Local : LLM_BASE_URL=http://localhost:11434/v1  LLM_MODEL=gemma3:12b  (key ignored)
//   Hosted: LLM_BASE_URL=<provider>/v1  LLM_MODEL=<gemma model id>  LLM_API_KEY=...
const BASE = process.env.LLM_BASE_URL ?? "http://localhost:11434/v1";
const MODEL = process.env.LLM_MODEL ?? "gemma3:12b";
const KEY = process.env.LLM_API_KEY ?? "ollama";

async function complete(messages: Message[], opts: { json?: boolean; maxTokens?: number; temperature?: number } = {}): Promise<string> {
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 900,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/** Generate a validated profile. Strict parse, one retry with the error, then lenient repair. */
export async function generateProfile(messages: Message[], fallbackName: string): Promise<GhostProfile> {
  let raw = await complete(messages, { json: true, temperature: 0.6 });
  try {
    return parseProfileStrict(raw);
  } catch (e) {
    const hint = `Your last reply was invalid: ${String(e).slice(0, 400)}. Reply again with ONE valid JSON object using only the allowed values.`;
    raw = await complete([...messages, { role: "assistant", content: raw }, { role: "user", content: hint }], { json: true, temperature: 0.3 });
    try {
      return parseProfileStrict(raw);
    } catch {
      return parseProfileLenient(raw, fallbackName);
    }
  }
}

export async function chatReply(system: string, history: { role: "user" | "assistant"; content: string }[]): Promise<string> {
  return complete([{ role: "system", content: system }, ...history.slice(-10)], { maxTokens: 200, temperature: 0.8 });
}
