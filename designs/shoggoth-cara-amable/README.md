# shoggoth-cara-amable

> **«¿Qué hay tras la cara amable de la IA?»** The famous *"shoggoth
> with a smiley face"* meme, **re-drawn from scratch** as a bold
> linocut / flash-tattoo style illustration built for a tee. A vast
> creature made of bulging blobs, covered in eyes and tentacles, with a
> vertical fanged maw and an eye staring out of its throat. It is the
> alien intelligence that emerges from training a model on the whole
> internet. At the end of one tentacle it holds up a worried pink
> human **mask**, and out of the mask's mouth pokes a little yellow
> **smiley**. Three small labels trace the pipeline that produces
> today's chatbots:
> **«Aprendizaje no supervisado»** → the beast, **«Ajuste fino supervisado»**
> → the mask, **«RLHF (la guinda)»** → the smiley. The point isn't that AI
> is a monster. The *friendliness* is a thin, learned veneer over something
> we don't understand, and "it seems nice" is not "it is safe".

## Voice lane

**A — Thoughtful policy conversation.** This is the field's own teaching
diagram, drawn as a striking graphic rather than a scare. It invites the
museum / conference / classroom question *"wait, how does a chatbot get
made?"*, and the honest answer is unsettling on its own, with no
catastrophe imagery needed. The headline question makes the prompt explicit.

## Status

`draft`

## Languages

- [x] Spanish (`es.orange.front.svg`, canonical; white/black generated)
- [x] English (`en.orange.front.svg`, canonical; white/black generated).
      Phrase → "WHAT'S BEHIND / THE FRIENDLY FACE / OF AI?" (accents
      **BEHIND / FRIENDLY / AI**). Labels → "UNSUPERVISED LEARNING" /
      "SUPERVISED FINE-TUNING" / "RLHF (cherry on top)". Uses the
      `pauseai-global` logo.

## Target products

- [x] T-shirt, front print (200 × 200 mm), orange / white / black
- [x] Back: QR + URL via `scripts/build-qr.py` (language-agnostic)
- Stickers: the creature alone (`#art`) works as a die-cut at ≥ 7 cm.

## Colors supported

- [x] Orange (`es.orange.front.svg`, canonical)
- [x] White (`es.white.front.svg`, generated)
- [x] Black (`es.black.front.svg`, generated)

## The art: one silhouette, carved

The creature is a **single solid deep-green silhouette** with all its detail **carved
out**, meaning nothing is printed there and the tee shows through. The
carving covers the gaps between overlapping bulbs and tentacles, the
engraved hatching along their shadow sides, the cracks, the tentacle
grooves, and the rings around every eye. Plus a few flat spot fills:

| Layer (`<g id>`) | Orange tee | White tee | Black tee |
|---|---|---|---|
| `shoggoth-body`: silhouette, stalk, smiley rays | green `#1F5C38` | green | green |
| `shoggoth-white`: sclerae, fangs, glints | PAPER | PAPER | PAPER |
| `shoggoth-iris`: every iris | ORANGE `#FF9416` | ORANGE | ORANGE |
| `shoggoth-mask`: the mask | pink `#EC85C9` | pink | pink |
| `shoggoth-smiley`: the smiley | yellow `#FBD24A` | yellow | yellow |
| `shoggoth-ink` (`class="keep"`): pupils, gullet, mask + smiley features | INK | INK | INK |
| Phrase, labels, arrows (**body**) | INK | INK | PAPER `#FFFFFF` |
| Accents **TRAS / AMABLE / IA** (EN: BEHIND / FRIENDLY / AI) | WHITE | ORANGE | ORANGE |
| Logo | on-orange | on-light | on-dark |

The whole creature is **constant on every tee**; only the text and logo change.
Because detail is *knocked out* rather than printed in a tee colour, the
carving takes the tee's colour: orange lines on the orange tee, white on
white, black on black. Green, pink and yellow are `illustrationColors` in
[`brand/tokens.json`](../../brand/tokens.json) (non-brand, design-specific).
Iris orange is the brand orange.

## Layout

- **Top-left:** `¿QUÉ HAY `**`TRAS`** sits in the empty space above the mask.
- **Middle:** the mask + smiley on the left, held out on a long tentacle by
  the beast on the right. Eyestalks and whips rise beside the headline,
  but stay clear of the logo's clear space (art top ≥ ~66 mm).
- **Bottom (centred):** `LA CARA `**`AMABLE`** / `DE LA `**`IA`**`?`.

The reading path runs *¿qué hay tras* → the friendly face → *la cara amable
de la IA?*. The three stage labels (4.2 pt) point with short arrows at the
maw, the mask and the smiley. Text lives in the canonical SVGs, so edit it
there, then regenerate the variants.

## Sources & attribution (verified)

The art is an **original drawing**: nothing is traced and no raster is
used. Its composition deliberately follows Anna Husfeldt's CC BY-SA
illustration (the fanged maw, eyes on stalks, the mask on a tentacle, and
the smiley on a stalk from the mask's mouth), so we treat it as an
**adaptation** and credit her.

**Where the credit lives:** here, in this README, and not on the print. The
chapter chose a clean front over a fine-print credit line. CC BY-SA 3.0
asks for credit "reasonable to the medium", and credit that only appears in
the repo is the weakest reading of that. If the design is sold, printed at
volume, or contributed upstream, reconsider putting a one-line credit under
the back QR, e.g. *"Dibujo basado en la ilustración de Anna Husfeldt · CC BY-SA
3.0 · meme: @TetraspaceWest"*.

- **Reference illustration:** *"…putting smileys on a Shoggoth"*, drawn by
  **Anna Husfeldt**, released under **CC-BY-SA 3.0**.
  - Requested attribution string: *"Image created by Anna Husfeldt, released
    under CC-BY SA 3.0."*
  - Source: Thore Husfeldt, "Reinforcement Learning using Human Feedback is
    Putting Smileys on a Shoggoth", **2 March 2023**:
    https://thorehusfeldt.com/2023/03/02/reinforcement-learning-using-human-feedback-is-putting-smileys-on-a-shoggoth/
  - Also reproduced in Dan Smith, "The meaning of shoggoth AI memes",
    LessWrong, **31 July 2023**:
    https://www.lesswrong.com/posts/yjzW7gxk2h7bBs2qr/the-meaning-of-shoggoth-ai-memes
- **The meme concept** (shoggoth = the model, smiley = RLHF) originated with
  Twitter/X user **@TetraspaceWest, 30 December 2022**.
- **RLHF** = *Reinforcement Learning from Human Feedback*, the post-training
  step that makes a raw model behave like a polite assistant. "La guinda" =
  the cherry on top / finishing touch.
- **Translations** (standard ES ML terms, not a paraphrased quote):
  Unsupervised Learning → **Aprendizaje no supervisado**; Supervised
  Fine-tuning → **Ajuste fino supervisado**; RLHF (cherry on top) →
  **RLHF (la guinda)**.

### Licence / ShareAlike

CC-BY-SA 3.0 permits commercial use and adaptations **provided they are
shared alike**. This repo licenses its designs under **CC BY-SA 4.0**
([`/LICENSE-DESIGNS`](../../LICENSE-DESIGNS)), the Creative-Commons-approved
upgrade target for a 3.0 source, so this design ships under CC BY-SA 4.0
with Anna Husfeldt credited (see *Where the credit lives* above). (No real
person's likeness is used. The mask is a generic drawn face, not an
AI-generated portrait.)

## How the art is made

The creature is generated by **`scripts/draw-shoggoth.py`**, which is
deterministic (fixed seed). It is a one-off art tool, **not** a pipeline
stage:

```sh
brew install potrace
python3 -m venv .venv && .venv/bin/pip install pillow numpy scipy
.venv/bin/python scripts/draw-shoggoth.py --preview /tmp/shog   # PNG previews per tee
.venv/bin/python scripts/draw-shoggoth.py                       # splice into es+en canon
./scripts/build-all.sh                                          # variants, prints, mockups
```

How it works:
1. Every part is built from Catmull-Rom splines, lumpy blobs and discs:
   `bubble()` (body lobes with hatching + cracks), `tentacle()` (tapered,
   grooved, eyes along it), `eyestalk()`, `tendril()`, `maw()`, `mask()`,
   `smiley()` and `eye()`.
2. The parts are painted in painter's order into a label raster (20 px/mm),
   one label per print colour. Each part first paints a knock-out outline,
   which is what separates overlapping tentacles.
3. Each colour is vectorised with potrace. Lower colours get a 3 px underlay
   beneath the colours stacked on them, so there are no seams between
   separations.
4. The result replaces `<g id="art">` in both canonicals, placed on the
   canvas by `ART_SCALE` / `ART_DX` / `ART_DY`. Headline and labels are
   untouched.

To reshape the creature, edit `draw_creature()` (coordinates are mm in the
drawing frame), preview, and re-splice. If the art moves, re-aim the label
arrows in both canonicals.

## Constraints honored

- [x] Brand tokens for all swapping marks (`#111111`, `#FFFFFF`, `#FF9416`);
      spot colours (green, pink, yellow) read from `brand/tokens.json`
      (`illustrationColors`)
- [x] Carved lines ≥ 0.4 mm at canvas scale (`THIN × ART_SCALE`, asserted)
- [x] Does not modify any file in `brand/logos/` (logo swapped wholesale)
- [x] Fits the 200 × 200 mm print area with ≥ 5 mm safe margins
- [x] No embedded raster, pure vector (~80 KB per front)
- [x] Text outlined for production by `scripts/print-export.py`

## Notes / caveats

- **Ink count:** green body, white, orange, pink, yellow, and ink details
  (6 screens). DTG is the natural fit. For screen
  print the large solid body is easy, but proof the fine carving (hatching
  ≈ 0.4–0.65 mm) at the densest spots: the maw fangs and the eye rings.
- On the **black tee** the deep green is the lowest-contrast of the three,
  so it reads darker there. The white eyes and orange irises carry it.
- On the **orange tee** the carving shows orange, which reads as a warm
  "glow" around the eyes. That is intentional.
- The front has no credit line; attribution is in this README (see
  *Sources & attribution*).
- Replaces an earlier version that traced Anna's drawing directly and washed
  it green. At chest size it read as a muddy, busy blob. This version keeps
  the green but as a solid, carved silhouette.
