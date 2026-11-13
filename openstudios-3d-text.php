<?php

/**
 * Plugin Name:  Open Studios 3D Text
 * Description:  Turn selected text into a 3D Text block in the WordPress block editor.
 * Version:      0.4.0
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

define( 'OS3DT_VERSION', '0.4.0' );
define( 'OS3DT_PLUGIN_FILE', __FILE__ );
define( 'OS3DT_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );

require_once OS3DT_PLUGIN_DIR . 'includes/cache-store.php';
require_once OS3DT_PLUGIN_DIR . 'includes/presets.php';
require_once OS3DT_PLUGIN_DIR . 'includes/mappings.php';
require_once OS3DT_PLUGIN_DIR . 'includes/rest.php';
require_once OS3DT_PLUGIN_DIR . 'includes/render.php';
require_once OS3DT_PLUGIN_DIR . 'includes/admin-page.php';

/**
 * Build the typeface URL map shipped with the plugin.
 *
 * @return array<string, array<string, string>>
 */
function os3dt_font_map() {
	$families = array( 'helvetiker', 'optimer', 'gentilis' );
	$weights  = array( 'regular', 'bold' );
	$fonts    = array();

	foreach ( $families as $family ) {
		$fonts[ $family ] = array();
		foreach ( $weights as $weight ) {
			$fonts[ $family ][ $weight ] = plugins_url(
				"assets/fonts/{$family}_{$weight}.typeface.json",
				__FILE__
			);
		}
	}

	return $fonts;
}

/**
 * Register the 3D Text block and share runtime asset URLs with its scripts.
 */
function os3dt_register_block() {
	$build_path = plugin_dir_path( __FILE__ ) . 'build';

	if ( ! file_exists( $build_path . '/block.json' ) ) {
		return;
	}

	$block = register_block_type( $build_path );

	if ( ! $block ) {
		return;
	}

	$data = wp_json_encode(
		array(
			'fonts'      => os3dt_font_map(),
			'publicPath' => plugins_url( 'build/', __FILE__ ),
			'restUrl'    => esc_url_raw( rest_url( 'os3dt/v1' ) ),
			'version'    => OS3DT_VERSION,
		)
	);

	$handles = array_unique(
		array_filter(
			array_merge(
				(array) $block->editor_script_handles,
				(array) $block->script_handles,
				(array) $block->view_script_handles
			)
		)
	);

	foreach ( $handles as $handle ) {
		wp_add_inline_script(
			$handle,
			'window.os3dt = ' . $data . ';',
			'before'
		);
	}
}
add_action( 'init', 'os3dt_register_block' );

/**
 * Ensure shared block styles load on the front end when a 3D Text block is present.
 */
function os3dt_enqueue_front_styles() {
	if ( is_admin() ) {
		return;
	}
	$style = OS3DT_PLUGIN_DIR . 'build/style-index.css';
	if ( ! file_exists( $style ) ) {
		return;
	}
	wp_enqueue_style(
		'os3dt-style',
		plugins_url( 'build/style-index.css', OS3DT_PLUGIN_FILE ),
		array(),
		(string) filemtime( $style )
	);
}
add_action( 'wp_enqueue_scripts', 'os3dt_enqueue_front_styles' );
