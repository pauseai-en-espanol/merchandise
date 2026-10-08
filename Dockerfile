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

ARG NODE_IMAGE=node:26.10.0-alpine
# Pin pnpm here to match the root package.json `packageManager` field.
# Node 26 dropped the bundled corepack shim, so install pnpm directly via npm.
ARG PNPM_VERSION=12.9.1

# ------ build ------
FROM ${NODE_IMAGE} AS build

ARG PNPM_VERSION
RUN npm install -g pnpm@${PNPM_VERSION}

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
RUN PACKAGED=true pnpm install --frozen-lockfile

# Design sources, brand assets and the six tee photos the site composes onto.
COPY designs ./designs
COPY brand ./brand
COPY mockups/tshirt-*.jpg ./mockups/

# Public address of the site, for absolute links in the social preview tags.
ARG VITE_SITE_URL=https://merchandise.pauseai.es
RUN cd packages/web && VITE_SITE_URL="${VITE_SITE_URL}" pnpm build

# Everything world-readable: the nginx worker runs as non-root.
RUN cp -r packages/web/dist /output && chmod -R a+rX /output

# ------ serve ------
FROM nginx:alpine

COPY --from=build /output /usr/share/nginx/html

EXPOSE 80
