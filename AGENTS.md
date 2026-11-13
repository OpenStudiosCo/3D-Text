# Agent instructions

Guidance for coding agents working in the Open Studios 3D Text repository.

This is a focused WordPress block plugin: it registers a **3D Text** block, exposes it in the Gutenberg Transform To menu, and renders extruded type with Three.js. Prefer comprehensibility and craftsmanship over merely producing code that works.

## Engineering philosophy

Treat code as architectural storytelling. The structure should reveal responsibilities:

- **Bootstrap (PHP)** — plugin header, `ABSPATH` guard, `register_block_type` from `build/`, inline `window.os3dt` config (font URL).
- **Composition roots (`src/index.js`, `src/view.js`)** — thin wiring that registers the WordPress block or mounts the front end; they do not own domain logic.
- **Type (`src/type/`)** — what is written: plain text, fonts, content tag, pose / extrusion / appearance settings and `data-os3dt-*` helpers.
- **Scene (`src/scene/`)** — how it is seen: `TextScene` (extruded Three.js presentation). No React, no Gutenberg.
- **WordPress bridge (`src/integrations/wordpress/`)** — host adapter organised by WP domain (`block/`, `editor/`, `save/`, `view/`). The only place that imports `@wordpress/*`.
- **Compiled assets (`build/`)** — output of `@wordpress/scripts`; shipped with the plugin.
- **Publication shell** — `readme.txt`, `LICENSE`, `assets/`, `languages/` for WordPress.org readiness.

Do not impose Media Library, AJAX, or script-module patterns from sibling plugins unless this product genuinely needs them.

## Working principles

1. Inspect neighbouring modules and Gutenberg contracts before changing behaviour.
2. Keep changes focused; do not bolt unrelated features onto an editor-mode task.
3. Prefer British English in new comments, documentation and commit messages (`behaviour`, `normalise`).
4. Prefix PHP functions and handles with `os3dt_` / `os3dt-`.
5. Keep the text domain and plugin slug as `openstudios-3d-text`; block name as `openstudios/three-d-text` (block name segments must start with a letter — `3d-text` is rejected by Gutenberg).
6. Do not import `@wordpress/*` from `src/type/` or `src/scene/`. WordPress work belongs under `src/integrations/wordpress/`. First-party modules must not import the integration layer.

## Reference layout

- `openstudios-3d-text.php` — WordPress bootstrap and script config.
- `src/block.json` — block metadata (`viewScript` for front-end Three.js).
- `src/index.js` — editor composition root: `registerBlockType` wired to the WordPress integration.
- `src/view.js` — front-end composition root: calls `integrations/wordpress/view/mount`.
- `src/public-path.js` — webpack public path from `window.os3dt`.
- `src/type/` — plain text, fonts, content tag, settings.
- `src/scene/text-scene.js` — `TextScene` class (`mount` / `update` / `setSettings` / `dispose`).
- `src/integrations/wordpress/block/` — inserter icon and transforms.
- `src/integrations/wordpress/editor/` — edit/preview toolbar, inspector, preview host, `editor.scss`.
- `src/integrations/wordpress/save/save.js` — saved markup.
- `src/integrations/wordpress/view/mount.js` — front-end mount into saved markup.
- `src/integrations/wordpress/style.scss` — shared block CSS (WP class contract; basename must stay `style` for wp-scripts).
- `assets/fonts/` — typeface JSON for `TextGeometry` (helvetiker / optimer / gentilis × regular / bold).
- `assets/` — WordPress.org icons (and screenshots when available).
- `languages/` — translation template(s).

## Editor modes

Mode is **local React state** in the WordPress editor integration, not a block attribute: it must not dirty the post or serialise to the front end.

- **Edit** — RichText visible; Three.js canvas unmounted.
- **Preview** — RichText hidden; `integrations/wordpress/editor/preview.js` mounts `TextScene` to match front-end behaviour.

Pose, typeface, extrusion, colour and shininess **are** block attributes and persist via `data-os3dt-*` on save.

## Transforms

Transform To lists blocks that declare `transforms.from` of `type: 'block'` including the selected block (for example `core/paragraph`). Put transforms in `src/integrations/wordpress/block/transforms.js`; `src/index.js` only registers them. They are not expressible in `block.json`.

## Validation

After meaningful changes:

1. Run `npm run build` (or rely on `npm start`).
2. Confirm the plugin still activates.
3. Confirm **3D Text** appears in Transform To for a Paragraph, with the custom icon, and that content survives the transform both ways where supported.
4. Confirm toolbar edit/preview toggling mounts and disposes the canvas cleanly, and the front end shows extruded text.
