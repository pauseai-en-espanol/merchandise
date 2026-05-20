# PauseAI Merchandise

Open-source designs for [PauseAI en Español](https://es.pauseai.info) —
physical merchandise (T-shirts, stickers, totes, posters) that helps spread
the message: **pause the development of frontier AI until its safety can be
ensured**.

Designs may also be contributed upstream to [PauseAI Global](https://pauseai.info).

## How this repo works

- **Designs are SVG source code.** They're authored and iterated on as text —
  often with Claude Code — and reviewed in pull requests like any other code.
  No proprietary design tool is required.
- **One folder per design** in `designs/`. Language variants live as siblings
  (`design.es.svg`, `design.en.svg`, `design.symbol.svg`).
- **Brand tokens** (colors, fonts, logos) live in `brand/` and are the single
  source of truth referenced by every design.
- **Product specs** (T-shirt print area, sticker dimensions, etc.) live in
  `products/` as YAML, so a single design can target multiple products.
- **Mockups and renders** are built from the SVG sources — they are not
  edited by hand and are not committed (see `.gitignore`).

## Quickstart

1. Read [`CLAUDE.md`](./CLAUDE.md) — the brief Claude (and humans) follow
   when creating a new design.
2. Copy `designs/_template/` to `designs/<your-design-slug>/`.
3. Fill in the design's `README.md` (intent, languages, target products).
4. Iterate on the SVG. Open it in any browser to preview.
5. Open a PR.

## Layout

```
brand/      canonical brand inputs (tokens, logos, fonts, guidelines)
designs/    source designs, one folder per concept
products/   product specs (print area, POD vendor notes)
mockups/    photos of blank products, used for previews
scripts/    (added when needed) build/export pipeline
```

## License

- **Designs** (everything in `brand/`, `designs/`, `mockups/`, `products/`):
  [CC BY-SA 4.0](./LICENSE-DESIGNS) — share, remix, attribute, share-alike.
- **Code** (scripts, build tooling): [MIT](./LICENSE-CODE).

## Links

- [PauseAI en Español](https://es.pauseai.info)
- [PauseAI Global](https://pauseai.info)
- [How to contribute](./CONTRIBUTING.md)
