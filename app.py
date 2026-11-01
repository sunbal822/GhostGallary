import json
import gradio as gr
import store
from ghost_core import (clean_profile, generate_profile, story_messages, famous_messages, photo_messages, chat_reply, lookup_famous)
from ghost_svg import gallery_html, card_html


def _choices():
    return [(r["profile"]["name"], r["slug"]) for r in store.public()]


def refresh():
    return gallery_html(store.public()), gr.update(choices=_choices())


def summon(name):
    if not name or not name.strip():
        return "Type a name first.", "", *refresh()
    try:
        title, extract = lookup_famous(name)
    except ValueError as e:
        return str(e), "", *refresh()
    except Exception as e:
        return f"Lookup failed: {e}", "", *refresh()
    slug = store.slugify(title)
    rec = store.by_slug(slug)
    msg = f"{title} was already haunting the gallery."
    if not rec:
        try:
            prof = generate_profile(famous_messages(title, extract), title)
        except Exception as e:
            return f"Model error: {e}", "", *refresh()
        rec = store.add("famous", prof, extract, "public", slug=slug)
        msg = f"{title} has been summoned."
    return msg, card_html(rec["profile"], "s"), *refresh()


def generate(name, story, photo):
    if not name or not name.strip():
        return "", "", "Give the ghost a name."
    if not (story and story.strip()) and not photo:
        return "", "", "Add a story, a photo, or both."
    try:
        msgs = photo_messages(name, photo, story or "") if photo else story_messages(name, story)
        prof = generate_profile(msgs, name.strip())
    except Exception as e:
        return "", "", f"Model error: {e}"
    editable = {k: v for k, v in prof.items() if k != "name"}
    return card_html(prof, "p"), json.dumps(editable, indent=1, ensure_ascii=False), "Review the traits on the right, edit if needed, then save."


def save(name, traits_json, story, visibility):
    if not traits_json:
        return "Generate a ghost first.", *refresh()
    try:
        prof = clean_profile(json.loads(traits_json), name.strip())
    except Exception:
        return "The traits JSON is not valid.", *refresh()
    ctx = (story or "").strip() or f'{prof["nutshell"]} {prof["tale"]}'
    rec = store.add("user", prof, ctx, "private" if visibility.startswith("Private") else "public")
    msg = "Saved to the public gallery." if rec["visibility"] == "public" else f'Saved privately. Keep this key to reopen or chat with her: {rec["token"]}'
    return msg, *refresh()


def open_private(token):
    rec = store.by_token(token)
    return card_html(rec["profile"], "o") if rec else "<p>No ghost found for that key.</p>"


def chat(message, history, slug, token):
    rec = store.by_token(token) if token and token.strip() else (store.by_slug(slug) if slug else None)
    if not rec:
        return "Pick a ghost from the list, or paste a private key."
    try:
        return chat_reply(rec["profile"], rec["context"], history, message)
    except Exception as e:
        return f"(The ghost is silent: {e})"


with gr.Blocks(title="Haunted Gallery") as demo:
    gr.Markdown("# 👻 Haunted Gallery\nSummon the famous, or turn someone you love into a ghost who remembers.")
    with gr.Tab("Gallery"):
        gallery = gr.HTML()
        rbtn = gr.Button("Refresh gallery")
        with gr.Accordion("Open a private ghost", open=False):
            tok_in = gr.Textbox(label="Private key")
            tok_card = gr.HTML()
            tok_in.submit(open_private, tok_in, tok_card)
    with gr.Tab("Summon a famous ghost"):
        sname = gr.Textbox(label="Name of someone who has passed", placeholder="Ada Lovelace")
        gr.Examples(["Ada Lovelace", "Nikola Tesla", "Frida Kahlo", "Albert Einstein", "Elvis Presley"], sname)
        sbtn = gr.Button("Summon", variant="primary")
        sstatus = gr.Markdown()
        scard = gr.HTML()
    with gr.Tab("Make your own ghost"):
        with gr.Row():
            with gr.Column():
                mname = gr.Textbox(label="Their name", placeholder="Susie")
                mstory = gr.Textbox(label="Their story", lines=6, placeholder="What they wore, loved, how they were...")
                mphoto = gr.Image(label="Photo (optional, only clothing and hair are used, never the face)", type="filepath")
                vis = gr.Radio(["Private (only with your key)", "Public (shown in the gallery)"], value="Private (only with your key)", label="Visibility")
                gbtn = gr.Button("Generate ghost", variant="primary")
            with gr.Column():
                mprev = gr.HTML()
                mtraits = gr.Textbox(label="Traits (editable JSON)", lines=14)
                mstatus = gr.Markdown()
                savebtn = gr.Button("Save ghost")
    with gr.Tab("Chat"):
        dd = gr.Dropdown(label="Ghost", choices=[])
        ctok = gr.Textbox(label="Or paste a private key", type="password")
        gr.ChatInterface(chat, additional_inputs=[dd, ctok])

    sbtn.click(summon, sname, [sstatus, scard, gallery, dd])
    gbtn.click(generate, [mname, mstory, mphoto], [mprev, mtraits, mstatus])
    savebtn.click(save, [mname, mtraits, mstory, vis], [mstatus, gallery, dd])
    demo.load(refresh, None, [gallery, dd])
    rbtn.click(refresh, None, [gallery, dd])

if __name__ == "__main__":
    demo.launch()  # add share=True for a temporary public link to your laptop
