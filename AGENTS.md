# Agent instructions

Guidance for coding agents working in the Open Studios 3D Text repository.

This is a focused WordPress block plugin: it registers a **3D Text** block, exposes it in the Gutenberg Transform To menu, and renders extruded type with Three.js. Prefer comprehensibility and craftsmanship over merely producing code that works.

## Engineering philosophy

Treat code as architectural storytelling. The structure should reveal responsibilities:

- **Bootstrap (PHP)** — plugin header, `ABSPATH` guard, `register_block_type` from `build/`, inline `window.os3dt` config (font URL).
- **Block source (`src/`)** — `block.json`, registration, transforms, edit/save/view, styles.
- **Three.js (`src/three/`)** — scene creation and editor preview surface; shared by editor preview and front-end `view.js`.
- **Compiled assets (`build/`)** — output of `@wordpress/scripts`; shipped with the plugin.
- **Publication shell** — `readme.txt`, `LICENSE`, `assets/`, `languages/` for WordPress.org readiness.

Do not impose Media Library, AJAX, or script-module patterns from sibling plugins unless this product genuinely needs them.

## Working principles

1. Inspect neighbouring modules and Gutenberg contracts before changing behaviour.
2. Keep changes focused; do not bolt unrelated features onto an editor-mode task.
3. Prefer British English in new comments, documentation and commit messages (`behaviour`, `normalise`).
4. Prefix PHP functions and handles with `os3dt_` / `os3dt-`.
5. Keep the text domain and plugin slug as `openstudios-3d-text`; block name as `openstudios/three-d-text` (block name segments must start with a letter — `3d-text` is rejected by Gutenberg).

## Reference layout

- `openstudios-3d-text.php` — WordPress bootstrap and script config.
- `src/block.json` — block metadata (`viewScript` for front-end Three.js).
- `src/index.js` — `registerBlockType`, icon, transforms.
- `src/edit.js` — edit vs preview modes (toolbar); RichText or `PreviewCanvas`.
- `src/save.js` / `src/view.js` — saved markup and front-end mount.
- `src/three/` — `createTextScene`, `PreviewCanvas`, plain-text helper.
- `assets/fonts/` — typeface JSON for `TextGeometry` (not shipped inside the `three` npm package).
- `assets/` — WordPress.org icons (and screenshots when available).
- `languages/` — translation template(s).

## Editor modes

Mode is **local React state**, not a block attribute: it must not dirty the post or serialise to the front end.

- **Edit** — RichText visible; Three.js canvas unmounted.
- **Preview** — RichText hidden; Three.js preview matches front-end behaviour.

## Transforms

Transform To lists blocks that declare `transforms.from` of `type: 'block'` including the selected block (for example `core/paragraph`). Put transforms in `src/index.js` beside registration; they are not expressible in `block.json`.

## Validation

After meaningful changes:

1. Run `npm run build` (or rely on `npm start`).
2. Confirm the plugin still activates.
3. Confirm **3D Text** appears in Transform To for a Paragraph, with the custom icon, and that content survives the transform both ways where supported.
4. Confirm toolbar edit/preview toggling mounts and disposes the canvas cleanly, and the front end shows extruded text.
