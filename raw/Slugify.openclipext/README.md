# Slugify

OpenClip extension scaffolded with `--with-npm`. TypeScript entry at `src/main.ts`; the
manifest points at the bundled `dist/main.js`.

## Build contract

The shipped artifact is `dist/main.js` (the manifest's `script`). Always rebuild before installing:

    npm install        # once
    npm run build      # after every edit to src/

Install (after build):

    ./scripts/install_extension.sh <this-folder>
