<?php
/**
 * Admin screen: mappings and single-page precache.
 *
 * @package OpenStudios_3D_Text
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register admin menu.
 */
function os3dt_admin_menu() {
	add_options_page(
		__( '3D Text', 'openstudios-3d-text' ),
		__( '3D Text', 'openstudios-3d-text' ),
		'manage_options',
		'os3dt-mappings',
		'os3dt_admin_render_page'
	);
}
add_action( 'admin_menu', 'os3dt_admin_menu' );

/**
 * Enqueue admin assets.
 *
 * @param string $hook Hook.
 */
function os3dt_admin_assets( $hook ) {
	if ( 'settings_page_os3dt-mappings' !== $hook ) {
		return;
	}

	$asset_path = OS3DT_PLUGIN_DIR . 'build/admin.asset.php';
	$script     = OS3DT_PLUGIN_DIR . 'build/admin.js';
	$deps       = array( 'wp-element', 'wp-api-fetch', 'wp-i18n', 'wp-components' );
	$ver        = OS3DT_VERSION;

	if ( file_exists( $asset_path ) ) {
		$asset = include $asset_path;
		if ( is_array( $asset ) ) {
			$deps = $asset['dependencies'] ?? $deps;
			$ver  = $asset['version'] ?? $ver;
		}
	}

	if ( file_exists( $script ) ) {
		wp_enqueue_script(
			'os3dt-admin',
			plugins_url( 'build/admin.js', OS3DT_PLUGIN_FILE ),
			$deps,
			$ver,
			true
		);
		wp_add_inline_script(
			'os3dt-admin',
			'window.os3dt = window.os3dt || ' . wp_json_encode(
				array(
					'fonts'      => os3dt_font_map(),
					'publicPath' => plugins_url( 'build/', OS3DT_PLUGIN_FILE ),
				)
			) . ';',
			'before'
		);
		wp_localize_script(
			'os3dt-admin',
			'os3dtAdmin',
			array(
				'restUrl' => esc_url_raw( rest_url( 'os3dt/v1' ) ),
				'nonce'   => wp_create_nonce( 'wp_rest' ),
			)
		);
	}

	$css = OS3DT_PLUGIN_DIR . 'build/admin.css';
	if ( file_exists( $css ) ) {
		wp_enqueue_style(
			'os3dt-admin',
			plugins_url( 'build/admin.css', OS3DT_PLUGIN_FILE ),
			array( 'wp-components' ),
			$ver
		);
	}
}
add_action( 'admin_enqueue_scripts', 'os3dt_admin_assets' );

/**
 * Render settings page shell.
 */
function os3dt_admin_render_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	echo '<div class="wrap"><h1>' . esc_html__( '3D Text mappings', 'openstudios-3d-text' ) . '</h1>';
	echo '<div id="os3dt-admin-root"></div></div>';
}
