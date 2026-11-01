import os
import re
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

import store
from ghost_core import clean_profile, generate_profile, famous_messages, lookup_famous
from ghost_svg import render_svg

app = FastAPI(title="Haunted Gallery")


def _seed(name, outfit, pat, color, hair, hc, item, acc, aura, move, nut, tale, epi):
    p = clean_profile(dict(outfit=outfit, outfitPattern=pat, outfitColor=color, hairStyle=hair, hairColor=hc, heldItem=item,
                           accessory=acc, auraColor=aura, movement=move, nutshell=nut, tale=tale, epitaph=epi,
                           chatPersona="Warm, curious and a little theatrical."), name)
    return {"slug": store.slugify(name), "profile": p}


# Hand-written defaults so the gallery is never empty and loads without the model.
SEEDS = [
    _seed("Albert Einstein", "jacket", "solid", "#6b6f7a", "wavy", "white", "telescope", "none", "#bfe3ff", "hop",
          "Physicist who reshaped our ideas of space, time and gravity.",
          "He drifts through the banquet hall pondering unified field theories, laughing quietly at the curvature of space-time, and, as ever, declining to wear socks.",
          "Still curious."),
    _seed("Cleopatra", "gown", "pleated", "#e5c158", "long", "black", "scroll", "crown", "#ffd700", "sway",
          "Last active ruler of the Ptolemaic Kingdom of Egypt, legendary diplomat and strategist.",
          "Draped in gossamer gold and royal lapis, she gazes across the banquet table with commanding intellect, whispering forgotten secrets of Alexandria into the moonlit air.",
          "I will not be triumphed over."),
    _seed("William Shakespeare", "robe", "solid", "#38294a", "short", "brown", "quill", "collar", "#dcd0ff", "pace",
          "Playwright, poet, and actor, widely regarded as the greatest writer in the English language.",
          "With feather quill poised over weathered vellum, he jots soliloquies for spirits, questioning whether all eternity is but a stage upon which we merely play.",
          "All the world's a stage."),
    _seed("Marie Curie", "gown", "solid", "#1c3d52", "bun", "blonde", "flask", "none", "#64ffda", "drift",
          "Pioneering physicist and chemist, two-time Nobel laureate in Physics and Chemistry.",
          "She gently cradles a glowing vial of phantom radium, casting an ethereal aquamarine radiance over the table while pondering the invisible energies that bind the cosmos.",
          "Nothing in life is to be feared, it is only to be understood."),
    _seed("Nikola Tesla", "suit", "solid", "#2b3a55", "slicked", "black", "tool", "none", "#8fe0ff", "spin",
          "Visionary engineer and inventor who revolutionized electricity and wireless power.",
          "He sits in quiet contemplation, blue electrical arcs dancing effortlessly across his fingertips, tuning into the cosmic frequencies that hum through the castle walls.",
          "He lit up the world."),
    _seed("Ada Lovelace", "gown", "solid", "#5b3a8c", "curly", "brown", "book", "none", "#c9b8ff", "pace",
          "Mathematician who wrote the first published algorithm meant for a machine.",
          "She haunts the library towers, quietly fixing infinite loops and dreaming of thinking machines composed of pure thought.",
          "The first programmer."),
    _seed("Frida Kahlo", "shawl", "floral", "#c2185b", "bun", "black", "paintbrush", "necklace", "#ffb86b", "sway",
          "Mexican painter known for vivid self-portraits and fierce honesty.",
          "She paints the walls of the afterlife in marigold orange while spirit monkeys and hummingbirds circle in celebration.",
          "She painted what she felt."),
    _seed("Leonardo da Vinci", "robe", "solid", "#8a5a3c", "long", "grey", "paintbrush", "none", "#ffe0a8", "drift",
          "Painter, inventor and tireless sketcher of flying machines.",
          "He covers parchment with sketches of celestial anatomy and perpetual motion wings, forever in wonder.",
          "Always sketching."),
]


def _row(r):
    p = r["profile"]
    uid = re.sub(r"[^a-z0-9]", "", r["slug"])
    return {"slug": r["slug"], "name": p["name"], "movement": p["movement"], "svg": render_svg(p, "a" + uid, 110),
            "big": render_svg(p, "b" + uid, 200), "nutshell": p["nutshell"], "tale": p["tale"], "epitaph": p["epitaph"]}


@app.get("/api/ghosts")
def ghosts():
    rows = {s["slug"]: s for s in SEEDS}
    for r in store.public():
        rows[r["slug"]] = r
    return [_row(r) for r in rows.values()]


class Name(BaseModel):
    name: str


@app.post("/api/summon")
def summon(b: Name):
    try:
        title, extract = lookup_famous(b.name)
    except ValueError as e:
        raise HTTPException(404, str(e))
    except Exception as e:
        raise HTTPException(502, f"Lookup failed: {e}")
    slug = store.slugify(title)
    rec = store.by_slug(slug) or next((s for s in SEEDS if s["slug"] == slug), None)
    if not rec:
        try:
            prof = generate_profile(famous_messages(title, extract), title)
        except Exception as e:
            raise HTTPException(502, f"Model error: {e}")
        rec = store.add("famous", prof, extract, "public", slug=slug)
    return _row(rec)


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
def index():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)
