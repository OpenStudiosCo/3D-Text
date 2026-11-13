=== Open Studios 3D Text ===
Plugin Name: Open Studios 3D Text
Contributors: openstudios
Tags: 3d, text, gutenberg, block, editor
Requires at least: 6.5
Tested up to: 7.0
Stable tag: 0.2.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Turn selected text into a 3D Text block from the Gutenberg Transform To menu.

== Description ==

Open Studios 3D Text adds a **3D Text** block to the WordPress block editor. Transform a paragraph or heading into 3D Text from the block switcher, or insert the block from the inserter.

This initial release scaffolds the block and transform path. Richer 3D presentation will follow in later versions.

== Features ==

* 3D Text block in the block editor
* Edit text or preview extruded Three.js output from the block toolbar
* Front-end Three.js rendering of the same text
* Transform from Paragraph or Heading
* Transform back to Paragraph
* Custom block icon in Transform To and the inserter

== Usage ==

1. Edit a post or page in the block editor
2. Select a Paragraph (or Heading) block
3. Open the block switcher (Transform To)
4. Choose **3D Text**

== Installation ==

1. Upload the `openstudios-3d-text` folder to `/wp-content/plugins/`
2. Activate the plugin through the Plugins screen
3. Ensure the `build/` directory is present (shipped with releases)

== Frequently Asked Questions ==

= Does this render real 3D yet? =

Not in 0.1.0. The block preserves text and appears in Transform To so further layers can be added safely.

= Which blocks can I transform from? =

Paragraph and Heading.

== Changelog ==

= 0.2.0 =
* Three.js extruded text on the front end
* Editor edit / preview modes for the 3D Text block

= 0.1.0 =
* Initial scaffold: plugin shell and 3D Text block with Transform To support

== Upgrade Notice ==

= 0.2.0 =
Adds Three.js preview and front-end rendering.

= 0.1.0 =
Initial release.
