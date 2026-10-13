# Changesets

Every change that reaches the web generator needs a changeset: run `pnpm release:note`, pick the packages it
touches and describe the change in a sentence. That includes design changes the site shows (a canonical front, a
`design.json`, the logos, the fonts, the tee photos): release `@pauseai-es/merch-web` for those. Changes that
don't reach the site (a design's README, prints, mockups, renders, docs, CI) take an empty one: `pnpm release:empty`.

Releases flow from these notes: after CI passes on main, the versions and changelogs are bumped, the site's image is
built as `<version>.<short sha>` and its tag is written into `charts/static/values.yaml`, which Argo CD deploys. See
the [changesets docs](https://github.com/changesets/changesets).
