<?php

/**
 * Plugin Name:  Open Studios 3D Text
 * Description:  Turn selected text into a 3D Text block in the WordPress block editor.
 * Version:      0.3.0
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
