# OpenClip Extensions

Catalog and hosting for OpenClip's official & community extensions. This repo is a submodule of
the `openclip` app repo, mounted at `Extensions/`.

## Layout
- `raw/<Name>.openclipext/` — extension sources (folders with `openclip.json` + code).
- `published/` — generated artifacts you generally do NOT edit by hand:
  - `<Name>.openclipext.zip` — built by `build-extensions.yml`
  - `catalog.json` — listing served to the in-app store
  - `extension-stats.json` — download counts, updated nightly
- `.github/workflows/build-extensions.yml` — builds each `raw/` source to a Release per version
  (`<identifier>@<version>`, attaching the zip), then commits `published/`.
- `.github/workflows/update-stats.yml` — nightly download-count update into `published/`.

## Managing from the app repo
- Edit sources under `raw/`, commit, and push — the build workflow releases + catalogs them.
- To republish a changed extension, bump `version` in its `openclip.json` (the tag gates reuse).
- After the build workflow commits `published/`, run `git submodule update` in the app repo to pull
  the new pointer.
