# shoggoth-cara-amable

> **«¿Qué hay tras la cara amable de la IA?»** The famous *"shoggoth
> with a smiley face"* drawing, traced to vector **line art** — its body
> washed a deep **green** with the **eyes left white** — and wrapped by that
> question. A vast, eye-studded, tentacled creature — the
> alien intelligence that emerges from training a model on the whole internet —
> wears a pink human-ish **mask** and finally a little yellow **smiley**.
> Three small labels trace the pipeline that produces today's chatbots:
> **«Aprendizaje no supervisado»** → the beast, **«Ajuste fino supervisado»**
> → the mask, **«RLHF (la guinda)»** → the smiley. The point isn't that AI
> is a monster; it's that the *friendliness* is a thin, learned veneer over
> something we don't understand — "it seems nice" is not "it is safe".

## Voice lane

**A — Thoughtful policy conversation.** It's the field's own teaching
diagram, rendered as a line-art explainer rather than a scare — it invites
the museum / conference / classroom question *"wait, how does a chatbot get
made?"* and the honest answer is unsettling on its own, no catastrophe
imagery required. The headline question makes the prompt explicit.

## Status

`draft`

## Languages

- [x] Spanish (`es.orange.front.svg` — canonical; white/black generated)
- [x] English (`en.orange.front.svg` — canonical; white/black generated).
      Phrase → "WHAT'S BEHIND / THE FRIENDLY FACE / OF AI?" (accents
      **BEHIND / FRIENDLY / AI**); labels → "UNSUPERVISED LEARNING" /
      "SUPERVISED FINE-TUNING" / "RLHF (cherry on top)"; uses the
      `pauseai-global` logo. (The original is English, natural for PauseAI Global.)

## Target products

- [x] T-shirt, front print (200 × 200 mm), orange / white / black
- [ ] Back: QR + URL via `scripts/build-qr.py` (language-agnostic)
- Stickers: possible at ≥ 8 cm so the linework stays legible.

## Colors supported

- [x] Orange (`es.orange.front.svg` — canonical)
- [x] White (`es.white.front.svg` — generated)
- [x] Black (`es.black.front.svg` — generated)

White/black tee variants produced by `scripts/build-shoggoth-cara-amable.py`;
the green body fill + white eyes are generated once by
`scripts/trace-shoggoth-body.py` and baked into the orange canonicals (see
*Colour* and *How the art was made* below).

## Colour: green body + white eyes + two spot fills

The creature is vector **line art** over a deep-green body fill. Three constant
spot-colour fills — the **green** body (`#1F5C38`), the **pink** mask, and the
**yellow** smiley — sit *behind* the linework, and the **eyes are punched out
to paper white** on top of the green. The fill lives in its own group
(`#shoggoth-fill`, holding `#shoggoth-body` then `#shoggoth-eyes`) placed before
`#art`, so the creature's linework, the mask's grimace and the smiley's
features all draw on top. Only the linework/text swap ink↔paper per tee; the
three fills and the white eyes are constant on every tee.

| Element | Orange tee | White tee | Black tee |
|---|---|---|---|
| Body fill | green `#1F5C38` | green | green |
| Eyes (sclera) | PAPER `#FFFFFF` | PAPER | PAPER |
| Mask face fill | pink `#EC85C9` | pink | pink |
| Smiley disc fill | yellow `#FBD24A` | yellow | yellow |
| Creature linework, phrase, labels, arrows, credit (**body**) | INK `#111111` | INK | PAPER `#FFFFFF` |
| Headline accents **TRAS / AMABLE / IA** (EN: BEHIND / FRIENDLY / AI) | WHITE `#FFFFFF` | ORANGE `#FF9416` | ORANGE `#FF9416` |
| Logo | on-orange | on-light | on-dark |

The three spot colours are documented in
[`brand/tokens.json`](../../brand/tokens.json) under **`illustrationColors`**
as *non-brand, design-specific* (do not reuse them as brand colours elsewhere).

**Reads per tee.** The green is strongest on the **black tee**, where the
linework flips to white and pops on the dark fill (there the eye outlines and
pupils flip to paper too, so the eyes read as solid white discs). On the
**white / orange** tees the black linework sits on the green at lower contrast
— the reason an earlier whole-body violet wash was dropped (`shoggothViolet`,
since removed from `brand/tokens.json`) — but here the **white eyes carry the
contrast** (white sclera + dark pupil), and the creature reads as a green,
eye-studded form. The fill is shipped on **all three tees** by design choice.

## Layout

A centred line drawing with the question wrapped top-and-bottom; positions are
hand-tuned and baked into the canonical SVGs.

- **Top** — `¿QUÉ HAY `**`TRAS`** (one line; accent word **TRAS**).
- **Centre** — the shoggoth line drawing (centred, ~115 mm wide).
- **Bottom** — `LA CARA `**`AMABLE`**, then `DE LA `**`IA`**`?`.

Read top-to-bottom through the image: *¿qué hay tras — [the friendly face] —
la cara amable de la IA?* Each headline line is a **single size**; the accent
words (**TRAS / AMABLE / IA**) carry `class="accent"` and differ by **colour
only**, swapping white↔orange per tee.

The three stage labels sit on the **left**, each hugging its target with a
short arrow — **aprendizaje no supervisado** (top-left → the beast/head),
**ajuste fino supervisado** (→ the mask) and **RLHF (la guinda)** (→ the
smiley). Edit the phrase/label positions directly in `es.orange.front.svg`,
then regenerate EN + white/black via the builder.

## Sources & attribution (verified)

This design is a **derivative of a Creative Commons illustration** — the
attribution below is a licence requirement, and a tiny credit line rides on
the print itself (`<text id="credit">`).

- **Illustration:** *"…putting smileys on a Shoggoth"*, drawn by
  **Anna Husfeldt**, released under **CC-BY-SA 3.0**.
  - Requested attribution string: *"Image created by Anna Husfeldt, released
    under CC-BY SA 3.0."*
  - Source: Thore Husfeldt, "Reinforcement Learning using Human Feedback is
    Putting Smileys on a Shoggoth", **2 March 2023** —
    https://thorehusfeldt.com/2023/03/02/reinforcement-learning-using-human-feedback-is-putting-smileys-on-a-shoggoth/
  - We **traced** it to a black line drawing (no raster is embedded) and
    **dropped** her English handwritten labels/arrows, **re-authoring** them
    as Spanish (and English) text. We kept it black-on-white with her pink
    mask and yellow smiley as she drew it; the linework, the mask face, and
    the composition are all hers.
- **The meme concept** (shoggoth = the model, smiley = RLHF) originated with
  Twitter/X user **@TetraspaceWest, 30 December 2022**. Credited on the print
  as `meme: @TetraspaceWest`.
- **RLHF** = *Reinforcement Learning from Human Feedback*, the post-training
  step that makes a raw model behave like a polite assistant. "La guinda" =
  the cherry on top / finishing touch.
- **Translations** (standard ES ML terms, not a paraphrased quote):
  Unsupervised Learning → **Aprendizaje no supervisado**; Supervised
  Fine-tuning → **Ajuste fino supervisado**; RLHF (cherry on top) →
  **RLHF (la guinda)**.

### Licence / ShareAlike

CC-BY-SA 3.0 permits commercial use and derivatives **provided the derivative
is shared alike**. This repo licenses its designs under **CC BY-SA 4.0**
([`/LICENSE-DESIGNS`](../../LICENSE-DESIGNS)), the Creative-Commons-approved
upgrade target for a 3.0 source — so this design ships under CC BY-SA 4.0
with Anna Husfeldt credited. Keep the credit line on any variant. (No real
person's likeness is used; this is an illustration, not an AI-generated
portrait.)

## How the art was made

`SVG is the source of truth` — the creature is **pure vector**, no embedded
raster. Reproducible:

```sh
brew install potrace                          # the line-art vectorizer
pip install pillow numpy scipy                 # in a venv; NOT pipeline deps
python3 scripts/trace-shoggoth.py <anna.jpeg> <outdir>
# then splice the emitted <g id="shoggoth-*"> layers back in between
# <g id="shoggoth"> … </g> in es.orange.front.svg, and run
# scripts/build-shoggoth-cara-amable.py
```

`scripts/trace-shoggoth.py` emits three layers: **shoggoth-mask** (a cleaned
solid pink face fill), **shoggoth-smiley** (a cleaned yellow disc), and
**shoggoth-ink** — *every* dark line of the drawing (creature + the mask's
grimace + the smiley's eyes/smile) via a **luminance** threshold, drawn on top
of the two fills. The light pink/yellow fills fall above the threshold and
drop out like the original's white paper; the blue English labels are excluded
explicitly. A connected-component pass despeckles and a 1-px grow keeps lines
print-safe. The source is resized to height 671 px so potrace's transform
matches the `<g id="art">` placement — a drop-in replacement. Requires `scipy`
in addition to pillow/numpy. `es.orange.front.svg` is the hand-maintained source.

### The green body fill + white eyes

The colour fill is derived from the committed linework (no source image
needed) by a second one-off generator:

```sh
brew install potrace                          # vectorizer (macOS qlmanage too)
pip install pillow numpy scipy                 # venv; NOT pipeline deps
python3 scripts/trace-shoggoth-body.py        # splices the fill into es+en canon
python3 scripts/build-shoggoth-cara-amable.py  # regenerate white/black variants
```

`scripts/trace-shoggoth-body.py` rasterises *only* `#shoggoth-ink` inside the
design's square `0 0 200 200` viewBox (so the pixel grid maps cleanly back to
mm), then: (1) builds the **silhouette** from local ink *density* — a gaussian
blur + threshold — because Anna's loose, open contours have no closed outline
to flood-fill; this hugs the creature without spilling into the background
between splayed tentacles; (2) detects the **eyes** as small, round, *enclosed*
white cells (it first seals hairline gaps in the eye outlines so open-outlined
eyes still register) and stamps them back as white discs on top of the green —
eyes that fall on the pink mask or yellow smiley are excluded so those faces
are untouched. potrace turns both masks into the `#shoggoth-body` (green) and
`#shoggoth-eyes` (white) paths, wrapped in `scale(200/N)` so they land exactly
under the linework. Re-running is idempotent (it replaces any existing
`#shoggoth-fill`). Tune `SIG`/`THRESH` (silhouette tightness) and
`EYE_MIN`/`EYE_ROUND` (eye selectivity) at the top of the script.

## Constraints honored

- [x] Brand tokens for all swapping marks (`#111111`, `#FFFFFF`, `#FF9416`)
- [x] Spot colours (green body, pink mask, yellow smiley) documented in
      `brand/tokens.json` under `illustrationColors`; the old violet body
      remains removed
- [x] Eyes punched out to paper white, kept off the mask/smiley faces
- [x] Body fill hugs the silhouette — no spill outside the creature
- [x] Does not modify any file in `brand/logos/` (logo swapped wholesale)
- [x] Fits the 200 × 200 mm print area with ≥ 5 mm safe margins
- [x] No embedded raster — vectorized line art + vectorized fill
- [x] Hairlines ≥ 0.4 mm at tee scale (traced lines ≈ 0.5 mm after dilation)
- [ ] Text outlined for production — run `scripts/print-export.py` before
      sending to the printer

## Notes / caveats

- **Ink count ⇒ best on DTG.** Now four print colours — green body, pink mask,
  yellow smiley, ink/paper linework — plus the white eyes and the logo's
  orange. Comfortable on DTG; for **screen-print** this is a bigger separation
  job (the green body is a large solid; the white eyes knock out of it), so
  proof the green + the densest area (the maw) first.
- **Reads on all three tees**, but differently: the **black tee** is the
  showcase (white linework on dark green); on **white / orange** the black
  linework sits quieter on the green and the **white eyes** do the heavy
  lifting. See *Colour → Reads per tee*.
- **File size ≈ 135 KB per front** — Anna's intricate linework plus the
  vectorized green silhouette and eyes (still pure vector, no embedded raster).
- The body fill is a chapter-added colour treatment over Anna's drawing; an
  earlier *whole-body* violet wash was dropped because it buried the linework.
  This version keeps the fill deep, flips the linework to white where it can
  (black tee), and punches the eyes white so the creature still reads.
