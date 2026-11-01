import html, random

HAIR = {"black": "#1b1b1f", "brown": "#5a3a22", "grey": "#9aa0a6", "white": "#f1f1f1", "blonde": "#e3c66f", "red": "#b5472a"}
ITEM = {"pie": "🥧", "yarn": "🧶", "book": "📖", "guitar": "🎸", "microphone": "🎤", "paintbrush": "🖌️", "lantern": "🏮", "flower": "🌸",
        "teacup": "🍵", "tool": "🔧", "camera": "📷", "ball": "⚽", "telescope": "🔭", "sheet_music": "🎼"}
ACC = {"glasses": ("👓", 60, 56), "hat": ("🎩", 60, 20), "crown": ("👑", 60, 20), "scarf": ("🧣", 60, 84), "necklace": ("📿", 60, 82),
       "bowtie": ("🎀", 60, 82), "headscarf": ("🧕", 60, 34), "gloves": ("🧤", 28, 108)}
BODY = "M22,60 C22,30 42,15 60,15 C78,15 98,30 98,60 L98,135 L86,125 L74,135 L60,125 L46,135 L34,125 L22,135 Z"
CAP = "M30,48 C32,22 88,22 90,48 C80,34 40,34 30,48Z"


def _hair(style, c):
    back = front = ""
    if style in ("long", "wavy"):
        back = f'<rect x="20" y="30" width="80" height="90" rx="22" fill="{c}"/>'
    if style == "afro":
        back = f'<circle cx="60" cy="38" r="44" fill="{c}"/>'
    if style == "curly":
        front = "".join(f'<circle cx="{x}" cy="{y}" r="10" fill="{c}"/>' for x, y in [(32, 40), (44, 28), (60, 22), (76, 28), (88, 40)])
    elif style != "afro" and style != "bald":
        front = f'<path d="{CAP}" fill="{c}"/>'
    if style == "bun":
        front += f'<circle cx="60" cy="14" r="10" fill="{c}"/>'
    if style == "ponytail":
        front += f'<circle cx="98" cy="58" r="9" fill="{c}"/>'
    return back, front


def render_svg(p, uid="x", size=120):
    hc = HAIR.get(p["hairColor"], "#9aa0a6")
    back, front = _hair(p["hairStyle"], hc)
    oc, pat = p["outfitColor"], p["outfitPattern"]
    overlay = {
        "striped": '<pattern id="pt{u}" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="4" fill="#fff" opacity=".35"/></pattern>',
        "knit": '<pattern id="pt{u}" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0,8 L4,0 L8,8" stroke="#000" stroke-width="1.4" fill="none" opacity=".3"/></pattern>',
        "checkered": '<pattern id="pt{u}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#fff" opacity=".3"/><rect x="6" y="6" width="6" height="6" fill="#fff" opacity=".3"/></pattern>',
        "floral": '<pattern id="pt{u}" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="2.5" fill="#fff" opacity=".6"/></pattern>',
    }.get(pat, "").replace("{u}", uid)
    top = f'<rect x="0" y="78" width="120" height="70" fill="url(#pt{uid})"/>' if overlay else ""
    emo = ""
    if p["heldItem"] in ITEM:
        emo += f'<text x="86" y="118" font-size="26" text-anchor="middle">{ITEM[p["heldItem"]]}</text>'
    if p["accessory"] in ACC:
        e, x, y = ACC[p["accessory"]]
        emo += f'<text x="{x}" y="{y}" font-size="24" text-anchor="middle">{e}</text>'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 150" width="{size}" height="{int(size*1.25)}">
<defs><radialGradient id="au{uid}"><stop offset="0" stop-color="{p["auraColor"]}" stop-opacity=".7"/><stop offset="1" stop-color="{p["auraColor"]}" stop-opacity="0"/></radialGradient>
<clipPath id="cp{uid}"><path d="{BODY}"/></clipPath>{overlay}</defs>
<circle cx="60" cy="75" r="68" fill="url(#au{uid})"/>{back}
<path d="{BODY}" fill="#f4f6ff" opacity=".95"/>
<g clip-path="url(#cp{uid})"><rect x="0" y="78" width="120" height="70" fill="{oc}"/>{top}</g>
{front}<ellipse cx="48" cy="56" rx="4" ry="6" fill="#222"/><ellipse cx="72" cy="56" rx="4" ry="6" fill="#222"/>
<path d="M52,70 Q60,77 68,70" stroke="#222" stroke-width="2.5" fill="none" stroke-linecap="round"/>{emo}</svg>'''


CSS = """<style>
.stage{position:relative;height:480px;overflow:hidden;border-radius:16px;background:radial-gradient(#1f1a4a,#07060f);color:#eee}
.mt{display:none}
.roamer{position:absolute;cursor:pointer;animation:rx var(--dx) ease-in-out infinite alternate,ry var(--dy) ease-in-out infinite alternate}
.roamer .g{display:block;animation-duration:2.2s;animation-iteration-count:infinite;animation-timing-function:ease-in-out;animation-direction:alternate}
.m-drift .g{animation-name:drift}.m-dance .g{animation-name:dance;animation-duration:.6s}.m-pace .g{animation-name:pace}
.m-spin .g{animation:spin 3s linear infinite}.m-hop .g{animation-name:hop;animation-duration:.5s}.m-sway .g{animation-name:sway}.m-patrol .g{animation-name:pace;animation-duration:1.2s}
@keyframes rx{from{left:2%}to{left:86%}}@keyframes ry{from{top:2%}to{top:68%}}
@keyframes drift{to{transform:translateY(-12px)}}@keyframes dance{from{transform:rotate(-14deg)}to{transform:rotate(14deg) translateY(-6px)}}
@keyframes pace{from{transform:translateX(-14px)}to{transform:translateX(14px)}}@keyframes spin{to{transform:rotate(360deg)}}
@keyframes hop{to{transform:translateY(-24px)}}@keyframes sway{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}
.modal{display:none;position:absolute;z-index:10;left:50%;top:50%;transform:translate(-50%,-50%);width:min(440px,86%);max-height:88%;overflow:auto;
background:#15122e;border:1px solid #6b5fd6;border-radius:14px;padding:16px;color:#eee;text-align:center}
.mt:checked+.roamer+.modal{display:block}.modal .x{position:absolute;right:12px;top:8px;cursor:pointer;font-size:18px}
.card{background:#15122e;color:#eee;border:1px solid #6b5fd6;border-radius:14px;padding:16px;text-align:center}
.card i{opacity:.8}.empty{padding:150px 20px;text-align:center}
</style>"""


def _text(p):
    return (f'<h3 style="margin:6px 0">{html.escape(p["name"])}</h3><p>{html.escape(p["nutshell"])}</p>'
            f'<p><i>{html.escape(p["tale"])}</i></p><p><b>{html.escape(p["epitaph"])}</b></p>')


def card_html(p, uid="c"):
    return f'{CSS}<div class="card">{render_svg(p, uid, 150)}{_text(p)}</div>'


def gallery_html(records):
    if not records:
        return f'{CSS}<div class="stage"><div class="empty">No ghosts yet. Summon one or make your own.</div></div>'
    out = [CSS, '<div class="stage">']
    for i, r in enumerate(records):
        p, uid = r["profile"], f'g{i}'
        random.seed(r["slug"])
        dx, dy = random.uniform(14, 26), random.uniform(10, 20)
        out.append(
            f'<input type="checkbox" id="m-{uid}" class="mt">'
            f'<label for="m-{uid}" class="roamer m-{p["movement"]}" style="--dx:{dx:.1f}s;--dy:{dy:.1f}s;animation-delay:-{random.uniform(0, 20):.1f}s,-{random.uniform(0, 20):.1f}s" title="{html.escape(p["name"])}">'
            f'<span class="g">{render_svg(p, uid, 90)}</span></label>'
            f'<div class="modal"><label for="m-{uid}" class="x">✕</label>{_text(p)}<small>Chat with them in the Chat tab.</small></div>'
        )
    out.append("</div>")
    return "".join(out)
