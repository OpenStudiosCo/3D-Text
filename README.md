# Open Studios 3D Text

WordPress block plugin that adds a **3D Text** option to the Gutenberg Transform To menu.

## Status

Version `0.4.0` adds editor-side WebP caching, look presets, and heading mappings with one-post precache, on top of Three.js (`0.187`) extruded text (edit / preview and front-end `viewScript`).

## Requirements

- WordPress 6.5+
- PHP 7.4+
- Node.js (development only) for `@wordpress/scripts`

## Development

```bash
npm install
npm start    # watch build
npm run build
```

The plugin registers the block from the compiled `build/` directory. Releases should include `build/`.

## Licence

GPLv2 or later. See [LICENSE](LICENSE).

## Links

- [Open Studios](https://openstudios.xyz)
