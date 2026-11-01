import base64, io, json, os, re, requests
from PIL import Image

BASE = os.getenv("LLM_BASE_URL", "http://localhost:11434/v1")
MODEL = os.getenv("LLM_MODEL", "gemma3:12b")
KEY = os.getenv("LLM_API_KEY", "ollama")

VOCAB = {
    "outfit": ["sweater", "dress", "suit", "coat", "robe", "tshirt", "uniform", "apron", "jacket", "gown", "shawl", "traditional"],
    "outfitPattern": ["solid", "striped", "knit", "checkered", "floral"],
    "hairStyle": ["bun", "short", "long", "curly", "afro", "wavy", "ponytail", "slicked", "bald"],
    "hairColor": ["black", "brown", "grey", "white", "blonde", "red"],
    "heldItem": ["none", "pie", "yarn", "book", "guitar", "microphone", "paintbrush", "lantern", "flower", "teacup", "tool", "camera", "ball", "telescope", "sheet_music"],
    "accessory": ["none", "glasses", "hat", "crown", "scarf", "necklace", "bowtie", "headscarf", "gloves"],
    "movement": ["drift", "dance", "pace", "spin", "hop", "sway", "patrol"],
}
DEFAULTS = {
    "outfit": "robe", "outfitPattern": "solid", "outfitColor": "#8a8fb5", "hairStyle": "short", "hairColor": "grey",
    "heldItem": "none", "accessory": "none", "auraColor": "#cfd8ff", "movement": "drift",
    "nutshell": "A quiet spirit with a story still being told.",
    "tale": "They drift through the gallery at night, humming something half remembered.",
    "epitaph": "Remembered.", "chatPersona": "A gentle, friendly ghost who speaks warmly and briefly.",
}
TEXT_MAX = {"nutshell": 400, "tale": 900, "epitaph": 160, "chatPersona": 900}
HEX = re.compile(r"^#[0-9a-fA-F]{6}$")

SYSTEM = f"""You turn a person's description into a friendly cartoon ghost profile for a memorial-style gallery.
Reply with ONE JSON object and nothing else.
Allowed values (use EXACTLY these strings):
""" + "\n".join(f"{k}: {' | '.join(v)}" for k, v in VOCAB.items()) + """
outfitColor, auraColor: hex like "#b3202a"
JSON keys: outfit, outfitPattern, outfitColor, hairStyle, hairColor, heldItem, accessory, auraColor, movement, nutshell, tale, epitaph, chatPersona
- nutshell: 2 sentences on who they were. tale: ~80 words, a playful story of how this ghost spends the afterlife, in character. epitaph: one line under 15 words. chatPersona: 2-3 sentences on how this ghost talks.
Rules: use ONLY the facts given; invented details only in the gentle afterlife tale. Be warm. No jokes about how they died, nothing cruel or about controversies. Pick heldItem/accessory from something real in the facts, else "none". movement: musician=dance, scientist/thinker=pace, calm=drift or sway, energetic=hop or spin, guardian/worker=patrol. Describe clothing, hair, items only, never faces."""


def clean_profile(obj, name):
    out = {**DEFAULTS, "name": name}
    if not isinstance(obj, dict):
        return out
    for k in DEFAULTS:
        v = obj.get(k)
        if v is None:
            continue
        if k in VOCAB:
            if v in VOCAB[k]:
                out[k] = v
        elif k in ("outfitColor", "auraColor"):
            if isinstance(v, str) and HEX.match(v):
                out[k] = v
        elif isinstance(v, str) and v.strip():
            out[k] = v.strip()[: TEXT_MAX[k]]
    return out


def _json(raw):
    a, b = raw.find("{"), raw.rfind("}")
    return json.loads(raw[a : b + 1])


def _complete(messages, json_mode=False, max_tokens=900, temp=0.7):
    body = {"model": MODEL, "messages": messages, "temperature": temp, "max_tokens": max_tokens}
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    r = requests.post(f"{BASE}/chat/completions", json=body, headers={"Authorization": f"Bearer {KEY}"}, timeout=240)
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"] or ""


def generate_profile(messages, name):
    for _ in range(2):  # one retry on bad JSON, then defaults
        try:
            return clean_profile(_json(_complete(messages, json_mode=True, temp=0.6)), name)
        except Exception:
            continue
    return clean_profile({}, name)


def story_messages(name, story):
    return [{"role": "system", "content": SYSTEM}, {"role": "user", "content": f"Make a ghost of {name}, a loved one. Use only what the writer says.\n\nStory:\n{story[:3000]}"}]


def famous_messages(name, facts):
    return [{"role": "system", "content": SYSTEM}, {"role": "user", "content": f"Make a ghost of {name}.\n\nFacts (Wikipedia, use only these):\n{facts[:2500]}"}]


def photo_messages(name, image_path, story=""):
    im = Image.open(image_path).convert("RGB")
    im.thumbnail((768, 768))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=85)
    url = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    text = f"Make a ghost of {name}, a loved one. From the photo describe ONLY clothing (type, color, pattern), hair, accessories and any held object. Do not describe the face."
    if story:
        text += f"\n\nThe writer also says:\n{story[:3000]}"
    return [{"role": "system", "content": SYSTEM}, {"role": "user", "content": [{"type": "image_url", "image_url": {"url": url}}, {"type": "text", "text": text}]}]


def chat_reply(profile, context, history, message):
    system = (f"You are the friendly ghost of {profile['name']}, talking to a visitor in a memorial gallery.\nHow you talk: {profile['chatPersona']}\n"
              f"The ONLY things you know about your life:\n{context[:3000]}\n"
              "Rules: stay in character, under 60 words, warm. If asked something you don't know, say you don't remember, gently. "
              "You are a playful remembrance, not a real spirit. If the visitor seems truly distressed, be kind and suggest talking to someone they trust.")
    def flat(c):
        if isinstance(c, list):
            return " ".join(p.get("text", "") if isinstance(p, dict) else str(p) for p in c)
        return c if isinstance(c, str) else str(c)
    msgs = [{"role": "system", "content": system}] + [{"role": h["role"], "content": flat(h["content"])} for h in history[-10:]] + [{"role": "user", "content": flat(message)}]
    return _complete(msgs, max_tokens=200, temp=0.8)


def lookup_famous(name):
    """Return (title, extract). Only people with a recorded death date qualify."""
    h = {"User-Agent": "HauntedGallery/0.1"}
    r = requests.get("https://en.wikipedia.org/api/rest_v1/page/summary/" + requests.utils.quote(name.strip().replace(" ", "_")), headers=h, timeout=20)
    if r.status_code != 200:
        raise ValueError("I couldn't find that person on Wikipedia.")
    d = r.json()
    if d.get("type") == "disambiguation" or not d.get("wikibase_item"):
        raise ValueError("That name is ambiguous. Try a fuller name.")
    ent = requests.get(f"https://www.wikidata.org/wiki/Special:EntityData/{d['wikibase_item']}.json", headers=h, timeout=20).json()
    claims = ent["entities"][d["wikibase_item"]]["claims"]
    if "P570" not in claims:
        raise ValueError("Not a ghost yet. Only people who have passed can be summoned.")
    return d["title"], d.get("extract", "")
