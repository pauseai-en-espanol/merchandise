# p-doom-evidencia

> The people who build frontier AI publicly estimate a non-trivial chance
> that it ends humanity. The chest carries a headline + a four-row table
> of named figures with their on-record p(doom) estimates, and a footer
> line — `...y la siguen construyendo.` — that turns the data into the
> accusation. Reads as cold evidence, not name-and-shame.

## Voice lane

**B — Accountability / protest.** Strongest evidence-to-defensibility
ratio of the activist set: the data does the work.

## Status

`draft` — copy and sources need pin-down before printing.

## Languages

- [x] Spanish (`design.es.svg`)
- [ ] English (`design.en.svg`)

## Target products

- [x] T-shirt on orange background

## Colors supported

- [x] Orange (`design.es.svg` / `back.svg` — canonical)
- [x] White (`design.es.white.svg` / `back.white.svg` — generated)
- [x] Black (`design.es.black.svg` / `back.black.svg` — generated)

Variants are produced by `scripts/build-color-variants.py` from the
canonical orange-tee SVG; do not edit the `.white.` / `.black.`
files directly. See `CLAUDE.md` for the swap rules.


## Sources (verified)

Values cross-checked against
[en.wikipedia.org/wiki/P(doom)](https://en.wikipedia.org/wiki/P(doom))
and confirmed by the chapter.

- **Geoffrey Hinton** (ex-Google; "Godfather of AI"; 2024 Nobel Prize
  in Physics)
  - Design value: `10–20 %` — his "all-things-considered" estimate per
    Wikipedia. Hinton has separately stated `>50 %` as his
    "independent impression"; the conservative figure is what we
    print on the chest.

- **Yoshua Bengio** (Université de Montréal / Mila)
  - Design value: `20 %`.

- **Dario Amodei** (CEO, Anthropic)
  - Design value: `10–25 %`.

- **Sam Altman** (CEO, OpenAI)
  - Design uses the verbatim phrase `«…fin del mundo»` rather than a
    percentage. Wikipedia lists Altman's number as `>0 %`, which is too
    weak to print; his 2014 blog quote ("AI will probably most likely
    lead to the end of the world") is the stronger and more honest
    statement to attribute to him here.
  - See `designs/altman-fin-del-mundo/README.md` for the full source
    notes on the Altman quote.

## Constraints honored

- [x] Brand tokens only
- [x] No `brand/logos/` modifications
- [x] Fits print area (200 × 200 mm)
- [x] No hairlines below 0.4 mm
- [ ] Text outlined for production
- [ ] Logo inlined for production

## Notes

- The headline `LO SABEN.` is the punchy form. Alternative tested:
  `LOS QUE LA CONSTRUYEN LO SABEN` — explicit but takes more visual
  space; revisit if `LO SABEN.` feels too cryptic in user testing.
- The footer line `...y la siguen construyendo.` is what converts a list
  of numbers into a political statement. Keep it.
- Names rendered as `Last name (org)` to keep the table compact while
  giving non-experts the affiliation context.
- The "fin del mundo" cell sits at the right column to read as a
  qualitative answer to the same question the % numbers answer — i.e.
  Altman's estimate, in his own words, is "fin del mundo".
- Back is `back.svg`: QR + URL.
