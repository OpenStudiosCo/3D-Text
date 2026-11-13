<?php

/**
 * Plugin Name:  Open Studios 3D Text
 * Description:  Turn selected text into a 3D Text block in the WordPress block editor.
 * Version:      0.1.0
 * Author:       Open Studios
 * Author URI:   https://openstudios.xyz
 * Text Domain:  openstudios-3d-text
 * Domain Path:  /languages
 * Tags:         3d, text, gutenberg, block, editor
 * License:      GPLv2 or later
 * License URI:  https://www.gnu.org/licenses/gpl-2.0.html
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register the 3D Text block from the compiled build metadata.
 */
function os3dt_register_block() {
	$build_path = plugin_dir_path( __FILE__ ) . 'build';

	if ( ! file_exists( $build_path . '/block.json' ) ) {
		return;
	}

	register_block_type( $build_path );
}
add_action( 'init', 'os3dt_register_block' );
