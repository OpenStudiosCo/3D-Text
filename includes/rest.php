<?php
/**
 * REST API for cache, presets and mappings.
 *
 * @package OpenStudios_3D_Text
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register REST routes.
 */
function os3dt_register_rest_routes() {
	register_rest_route(
		'os3dt/v1',
		'/cache',
		array(
			'methods'             => 'POST',
			'callback'            => 'os3dt_rest_cache_create',
			'permission_callback' => 'os3dt_rest_can_edit',
		)
	);

	register_rest_route(
		'os3dt/v1',
		'/cache/(?P<hash>[a-f0-9]{64})',
		array(
			array(
				'methods'             => 'GET',
				'callback'            => 'os3dt_rest_cache_get',
				'permission_callback' => 'os3dt_rest_can_edit',
			),
			array(
				'methods'             => 'DELETE',
				'callback'            => 'os3dt_rest_cache_delete',
				'permission_callback' => 'os3dt_rest_can_edit',
			),
		)
	);

	register_rest_route(
		'os3dt/v1',
		'/presets',
		array(
			array(
				'methods'             => 'GET',
				'callback'            => 'os3dt_rest_presets_list',
				'permission_callback' => 'os3dt_rest_can_edit',
			),
			array(
				'methods'             => 'POST',
				'callback'            => 'os3dt_rest_presets_create',
				'permission_callback' => 'os3dt_rest_can_edit',
			),
		)
	);

	register_rest_route(
		'os3dt/v1',
		'/presets/(?P<id>[a-zA-Z0-9_-]+)',
		array(
			array(
				'methods'             => 'PATCH',
				'callback'            => 'os3dt_rest_presets_update',
				'permission_callback' => 'os3dt_rest_can_edit',
			),
			array(
				'methods'             => 'DELETE',
				'callback'            => 'os3dt_rest_presets_delete',
				'permission_callback' => 'os3dt_rest_can_edit',
			),
		)
	);

	register_rest_route(
		'os3dt/v1',
		'/mappings',
		array(
			array(
				'methods'             => 'GET',
				'callback'            => 'os3dt_rest_mappings_list',
				'permission_callback' => 'os3dt_rest_can_manage',
			),
			array(
				'methods'             => 'POST',
				'callback'            => 'os3dt_rest_mappings_save',
				'permission_callback' => 'os3dt_rest_can_manage',
			),
		)
	);

	register_rest_route(
		'os3dt/v1',
		'/precache/(?P<id>\\d+)',
		array(
			'methods'             => 'GET',
			'callback'            => 'os3dt_rest_precache_candidates',
			'permission_callback' => 'os3dt_rest_can_manage',
			'args'                => array(
				'id' => array(
					'type'              => 'integer',
					'required'          => true,
					'sanitize_callback' => 'absint',
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'os3dt_register_rest_routes' );

/**
 * @return bool
 */
function os3dt_rest_can_edit() {
	return current_user_can( 'edit_posts' );
}

/**
 * @return bool
 */
function os3dt_rest_can_manage() {
	return current_user_can( 'manage_options' );
}

/**
 * POST /cache — multipart or JSON body.
 *
 * @param WP_REST_Request $request Request.
 * @return WP_REST_Response|WP_Error
 */
function os3dt_rest_cache_create( WP_REST_Request $request ) {
	$files = $request->get_file_params();
	$hash  = (string) $request->get_param( 'hash' );
	$w     = (int) $request->get_param( 'w' );
	$h     = (int) $request->get_param( 'h' );
	$post  = (int) $request->get_param( 'postId' );
	$key   = $request->get_param( 'key' );

	if ( is_string( $key ) ) {
		$key = json_decode( $key, true );
	}
	if ( ! is_array( $key ) ) {
		return new WP_Error( 'os3dt_bad_key', __( 'Missing cache key payload.', 'openstudios-3d-text' ), array( 'status' => 400 ) );
	}

	$bytes = '';
	if ( ! empty( $files['file']['tmp_name'] ) && is_uploaded_file( $files['file']['tmp_name'] ) ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$bytes = (string) file_get_contents( $files['file']['tmp_name'] );
	} else {
		$b64 = (string) $request->get_param( 'fileBase64' );
		if ( $b64 ) {
			$bytes = (string) base64_decode( $b64, true );
		}
	}

	if ( '' === $bytes ) {
		return new WP_Error( 'os3dt_no_file', __( 'Missing WebP file.', 'openstudios-3d-text' ), array( 'status' => 400 ) );
	}

	$result = os3dt_cache_store( $hash, $bytes, $w, $h, $key, $post );
	if ( is_wp_error( $result ) ) {
		return $result;
	}

	return rest_ensure_response( $result );
}

/**
 * GET /cache/{hash}
 *
 * @param WP_REST_Request $request Request.
 * @return WP_REST_Response|WP_Error
 */
function os3dt_rest_cache_get( WP_REST_Request $request ) {
	$hash = (string) $request['hash'];
	$url  = os3dt_cache_url( $hash );
	if ( is_wp_error( $url ) ) {
		return $url;
	}
	$exists = os3dt_cache_exists( $hash );
	$meta   = $exists ? os3dt_cache_read_meta( $hash ) : null;
	return rest_ensure_response(
		array(
			'exists' => $exists,
			'url'    => $exists ? $url : '',
			'w'      => $meta['w'] ?? 0,
			'h'      => $meta['h'] ?? 0,
		)
	);
}

/**
 * DELETE /cache/{hash}
 *
 * @param WP_REST_Request $request Request.
 * @return WP_REST_Response|WP_Error
 */
function os3dt_rest_cache_delete( WP_REST_Request $request ) {
	$result = os3dt_cache_delete( (string) $request['hash'] );
	if ( is_wp_error( $result ) ) {
		return $result;
	}
	return rest_ensure_response( array( 'deleted' => true ) );
}
