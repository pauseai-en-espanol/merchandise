# preguntame

> The wearer's invitation. A conditional setup in conversational Roboto
> Slab — *"Si te preocupa la IA y quieres hablar,"* — followed by an
> all-caps Saira payoff: **`AQUÍ ME TIENES.`** Turns the t-shirt into a
> real conversation opener: the wearer publicly declares that they are
> available, warmly, to talk to anyone who's worried. Designed for
> outreach events, meetups, and public spaces where one-on-one
> conversation is the goal.

## Voice lane

**B — Accountability / protest**, but the warmest end of it. The wearer
is offering a conversation, not picking a fight.

## Status

`draft`

## Languages

- [x] Spanish (`design.es.svg`)
- [ ] English (`design.en.svg`) — "ASK ME WHY / and let's talk" works as
      a direct port

## Target products

- [x] T-shirt on orange background

## Colors supported

- [x] Orange (`design.es.svg` / `back.svg` — canonical)
- [x] White (`design.es.white.svg` / `back.white.svg` — generated)
- [x] Black (`design.es.black.svg` / `back.black.svg` — generated)

Variants are produced by `scripts/build-color-variants.py` from the
canonical orange-tee SVG; do not edit the `.white.` / `.black.`
files directly. See `CLAUDE.md` for the swap rules.


## Sources

No external quotes. Original copy.

## Constraints honored

- [x] Brand tokens only
- [x] No logo modifications
- [x] Fits print area (200 × 200 mm)
- [x] No hairlines below 0.4 mm
- [ ] Text outlined for production
- [ ] Logo inlined for production

## Notes

- **Setup (2 lines):** `Si te preocupa la IA / y quieres hablar,` —
  Roboto Slab, sentence case, white. Reads like an actual sentence
  someone is saying, not a slogan.
- **Payoff:** `AQUÍ ME TIENES.` — Saira Condensed bold, all caps,
  white. The display-type jump from setup to payoff is the rhetorical
  device.
- Both lines in white for high contrast on the brand-orange tee. We
  considered ink (`#111`) for the setup to make it visually quieter,
  but on a bright orange that drops legibility too much at chest
  distance.
- The slogan name `preguntame` is now a misnomer — the design no
  longer says "pregúntame." Keeping the folder name for now (renaming
  would scramble cross-references in `CLAUDE.md` and prior PRs); if
  the design ships, consider renaming to `aqui-me-tienes` or similar.
- Alternative wordings discussed but rejected: see chat history for
  six candidates including `ME PREOCUPA. ¿A TI?` and `HABLEMOS.`
- Works best at events where the wearer is actively engaging with
  passers-by. As everyday wear, the chapter mark logo at the top
  still does the brand recognition before someone is close enough
  to read the slogan.
- Back is `back.svg`: QR + URL.
