# Builds the merch generator (packages/web) into a static nginx image.
#
# The site reads designs/, brand/ and the tee photos in mockups/ straight
# from the repo at build time, so the image always ships what is committed.
#
# Usage:
#   docker build --platform linux/amd64 \
#     -t harbor.danilupion.com/pauseai-es/merchandise:latest .
#
#   The site is served from the root of its own subdomain.

ARG NODE_IMAGE=node:26.13.0-alpine@sha256:c6ad9e9c1d80f6eb607c26b4b0a132ff7a2344fad1c78ea3baa2a7d4c8de6d94
# Pin pnpm here to match the root package.json `packageManager` field.
# Node 26 dropped the bundled corepack shim, so install pnpm directly via npm.
ARG PNPM_VERSION=12.14.0

# ------ build ------
FROM ${NODE_IMAGE} AS build

ARG PNPM_VERSION
RUN npm install -g pnpm@${PNPM_VERSION}

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
RUN PACKAGED=true pnpm install --frozen-lockfile

# Design sources, brand assets, the portraits' finishes and the six tee photos
# the site composes onto.
COPY designs ./designs
COPY brand ./brand
COPY illustrations/portraits ./illustrations/portraits
COPY mockups/tshirt-*.jpg ./mockups/
# Front renders on the three tees: the link previews of the share pages
# (packages/web/scripts/share-pages.ts).
COPY renders ./renders

# Public address of the site, for absolute links in the social preview tags.
ARG VITE_SITE_URL=https://merchandise.pauseai.es
RUN cd packages/web && VITE_SITE_URL="${VITE_SITE_URL}" pnpm build

# Everything world-readable: the nginx worker runs as non-root.
RUN cp -r packages/web/dist /output && chmod -R a+rX /output

# The preview server (packages/preview), which charts/static runs as its own
# Deployment from this same image: one bundled file, resvg's native module for
# this platform, and the repo files it draws from.
RUN pnpm --filter @pauseai-es/merch-preview build \
 && mkdir -p /preview/node_modules/@resvg /preview/repo/mockups \
 && cp packages/preview/dist/server.mjs /preview/ \
 && cp -rL node_modules/.pnpm/@resvg+resvg-js@*/node_modules/@resvg/resvg-js /preview/node_modules/@resvg/ \
 && for d in node_modules/.pnpm/@resvg+resvg-js-linux-*@*/node_modules/@resvg/*; do cp -rL "$d" /preview/node_modules/@resvg/; done \
 && tar -cf - designs/*/design.json designs/*/*.orange.front.svg designs/*/*.orange.front.short.svg \
      brand/logos brand/fonts/files \
      illustrations/portraits/*/lines.svg illustrations/portraits/*/halftone.svg illustrations/portraits/*/tone.svg \
    | tar -xf - -C /preview/repo \
 && cp mockups/tshirt-*-front.jpg /preview/repo/mockups/ \
 && chmod -R a+rX /preview

# ------ serve ------
FROM nginx:alpine@sha256:a3554c0d0b48177b1413c26e01f695334428020d9df01243fbae3e11cfd17417

COPY --from=build /output /usr/share/nginx/html

# The preview server's runtime: the build stage's Node, and the shared
# libraries it links (x86-64 builds need libatomic too, arm64 ones don't).
RUN apk add --no-cache libstdc++ libatomic
COPY --from=build /usr/local/bin/node /usr/local/bin/node
COPY --from=build /preview /preview
ENV REPO_ROOT=/preview/repo STATIC_ROOT=/usr/share/nginx/html

EXPOSE 80
