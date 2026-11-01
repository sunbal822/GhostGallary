# Ghost Gallery 👻🌼

A haunted castle for the people we miss. Scroll from the foggy exterior, through a lit window, into a midnight banquet of famous spirits, then through a portal to a graveyard where you can leave a white rose.

The part that matters: **add someone of your own.** Give a name, a memory and a photo. The photo is cut out, washed pale and made see-through, and your person joins the room. Then talk to them, by typing or by voice. They only know what you told them, and say so when the memory has faded.

Built for the Hacktoberfest Open-Source AI Challenge, *Ghost in the Machine*.

**Demo / write-up:** <link to your DEV post>

## Everything runs on your machine

| Job | Open piece | Where it runs |
| --- | --- | --- |
| Reads a loved one's photo (what they wear, hold, glow colour) | Gemma 3 via [Ollama](https://ollama.com) | localhost |
| Plays the ghost in chat | Gemma 3 via Ollama (any Ollama model works) | localhost |
| Writes profiles for summoned famous people | Gemma 3 via Ollama | localhost |
| Voice messages (speech to text) | OpenAI Whisper via Transformers.js | your browser |
| Cuts the person out of the photo | `@imgly/background-removal` (ISNet, ONNX Runtime Web) | your browser |

No accounts, no API keys, no fees. Your original photo is never saved; the server keeps only the see-through cut-out and the text.

## Run it

You need Node 18+ and Ollama.

```bash
ollama pull gemma3:12b        # or gemma3:4b on a smaller laptop
npm install --legacy-peer-deps
npm run dev
```

Open http://localhost:3000 (use `localhost`: browsers only allow the microphone there or on https).

Optional settings, see `.env.example`: `OLLAMA_MODEL`, `OLLAMA_VISION_MODEL`, `OLLAMA_URL`, `WIKI_CONTACT`.

First use downloads two models into your browser cache (about 80 MB each): the photo cut-out model and Whisper. After that they work offline.

## What still needs the internet

- The first model downloads above
- Google Fonts
- Summoning a famous person looks them up on Wikipedia (text and portrait)

## How it's built

- React + Vite front end, Express server (`server.ts`)
- The model proposes, the code decides: the photo reader must pick from fixed lists (head accessories, held items), anything else becomes "none", and bad colours fall back to defaults
- If Ollama is down, ghosts are still created with gentle default text and chat says its voice is faint
- Chat replies use only the facts you gave (name, story, epitaph) and never invent painful details
- Summoned ghosts are kept in server memory and disappear when it restarts; ghosts you make yourself are saved to `data/custom-ghosts.json` (git-ignored)

## Credits

Gemma (Google), Whisper (OpenAI), `@imgly/background-removal`, Transformers.js (Hugging Face), Wikipedia for portraits and summaries.
