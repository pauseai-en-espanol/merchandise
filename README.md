# PauseAI Merchandise

Open-source designs for [PauseAI en Español](https://pauseai.es) —
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
- **Mockups and renders** are built from the SVG sources by
  `scripts/build-all.sh` and are never edited by hand. Both are committed so
  reviewers can see every design on GitHub: composite SVGs in `mockups/`,
  JPEGs in `renders/`.

## Web generator

`packages/web` is a website where anyone can make their own run of shirts
from these designs, in four steps:

1. **Design and colour.** Pick a design and any tee colour. Orange, white
   and black print exactly as the chapter's own shirts; for any other
   colour the design adapts automatically, without new colours.
2. **Logo and website.** PauseAI en Español or PauseAI Global logo, and the
   address the QR on the back opens.
3. **Text.** Translate or adapt each line; long lines shrink to fit.
4. **Download.** A ZIP with outlined SVGs for print shops, 300 dpi PNGs for
   print-on-demand services, tee mockups and a print sheet with sizes,
   inks and credits.

The preview can be expanded to full screen and zoomed. The site starts in
the browser's language (Spanish or English, for the interface and the
design's text) and remembers every choice in the browser until "Start over".

```sh
pnpm install
pnpm dev                 # http://localhost:5173
pnpm check               # lint, typecheck, tests, prettier
```

The rendering engine lives in `packages/core` and is tested against the
Python pipeline's committed output. See [`CLAUDE.md`](./CLAUDE.md#web-generator)
for how designs reach the site.

### Docker build

```sh
# Static nginx image; the site is served from the root of its own subdomain
docker build --platform linux/amd64 \
  -t harbor.danilupion.com/pauseai-es/merchandise:latest .

# Try it locally
docker run --rm -p 8080:80 harbor.danilupion.com/pauseai-es/merchandise:latest
# → http://localhost:8080
```

Deployed with the Helm chart in `charts/static` (nginx config, optional
analytics snippet and redirects from GitOps values), like the
`presentaciones` repo.

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
scripts/    Python build/export pipeline
packages/   web generator: core (rendering engine) and web (the site)
charts/     Helm chart for deploying the web generator
```

## License

- **Designs** (everything in `brand/`, `designs/`, `mockups/`, `products/`):
  [CC BY-SA 4.0](./LICENSE-DESIGNS) — share, remix, attribute, share-alike.
- **Code** (scripts, build tooling): [MIT](./LICENSE-CODE).

## Links

- [PauseAI en Español](https://pauseai.es)
- [PauseAI Global](https://pauseai.info)
- [How to contribute](./CONTRIBUTING.md)
