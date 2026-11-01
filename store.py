import json, os, re, secrets, time

PATH = os.getenv("GHOST_DB", "data/ghosts.json")


def _load():
    try:
        with open(PATH, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def _save(rows):
    os.makedirs(os.path.dirname(PATH) or ".", exist_ok=True)
    with open(PATH, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=1)


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "ghost"


def public():
    return [r for r in _load() if r["visibility"] == "public"]


def by_slug(slug):
    return next((r for r in public() if r["slug"] == slug), None)


def by_token(token):
    t = (token or "").strip()
    return next((r for r in _load() if t and r.get("token") == t), None)


def add(kind, profile, context, visibility, slug=None):
    rec = {"slug": slug or f'{slugify(profile["name"])}-{secrets.token_hex(2)}', "kind": kind, "visibility": visibility,
           "token": secrets.token_urlsafe(10) if visibility == "private" else None, "profile": profile, "context": context, "created": time.time()}
    rows = _load()
    rows.append(rec)
    _save(rows)
    return rec
