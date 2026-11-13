<?php
/**
 * Look presets stored in wp_options.
 *
 * @package OpenStudios_3D_Text
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const OS3DT_PRESETS_OPTION = 'os3dt_presets';

/**
 * @return array<int, array<string, mixed>>
 */
function os3dt_presets_all() {
	$raw = get_option( OS3DT_PRESETS_OPTION, array() );
	return is_array( $raw ) ? array_values( $raw ) : array();
}

/**
 * @param array<int, array<string, mixed>> $presets Presets.
 */
function os3dt_presets_save_all( $presets ) {
	update_option( OS3DT_PRESETS_OPTION, array_values( $presets ), false );
}

/**
 * @param string $id Preset ID.
 * @return array<string, mixed>|null
 */
function os3dt_presets_get( $id ) {
	$id = (string) $id;
	foreach ( os3dt_presets_all() as $preset ) {
		if ( ( $preset['id'] ?? '' ) === $id ) {
			return $preset;
		}
	}
	return null;
}

/**
 * Look settings allowed in a preset (no offsets).
 *
 * @param array<string, mixed> $settings Incoming settings.
 * @return array<string, mixed>
 */
function os3dt_presets_look_only( $settings ) {
	$settings = is_array( $settings ) ? $settings : array();
	return array(
		'rotateX'    => isset( $settings['rotateX'] ) ? (float) $settings['rotateX'] : -6,
		'rotateY'    => isset( $settings['rotateY'] ) ? (float) $settings['rotateY'] : 16,
		'rotateZ'    => isset( $settings['rotateZ'] ) ? (float) $settings['rotateZ'] : 0,
		'sizeScale'  => isset( $settings['sizeScale'] ) ? (float) $settings['sizeScale'] : 1,
		'depth'      => isset( $settings['depth'] ) ? (float) $settings['depth'] : 0.08,
		'bevel'      => isset( $settings['bevel'] ) ? (float) $settings['bevel'] : 0,
		'fontFamily' => isset( $settings['fontFamily'] ) ? sanitize_text_field( (string) $settings['fontFamily'] ) : 'helvetiker',
		'fontWeight' => isset( $settings['fontWeight'] ) ? sanitize_text_field( (string) $settings['fontWeight'] ) : 'regular',
		'textColor'  => isset( $settings['textColor'] ) ? sanitize_text_field( (string) $settings['textColor'] ) : '',
		'shiny'      => ! empty( $settings['shiny'] ),
	);
}

/**
 * @return string
 */
function os3dt_presets_new_id() {
	return 'p_' . wp_generate_password( 12, false, false );
}

/**
 * @param WP_REST_Request $request Request.
 * @return WP_REST_Response
 */
function os3dt_rest_presets_list( WP_REST_Request $request ) {
	$presets = os3dt_presets_all();
	foreach ( $presets as &$preset ) {
		$hash = $preset['thumbHash'] ?? '';
		if ( os3dt_cache_is_valid_hash( $hash ) && os3dt_cache_exists( $hash ) ) {
			$url = os3dt_cache_url( $hash );
			$preset['thumbUrl'] = is_wp_error( $url ) ? '' : $url;
		} else {
			$preset['thumbUrl'] = '';
		}
	}
	unset( $preset );
	return rest_ensure_response( $presets );
}

/**
 * @param WP_REST_Request $request Request.
 * @return WP_REST_Response|WP_Error
 */
function os3dt_rest_presets_create( WP_REST_Request $request ) {
	$name     = sanitize_text_field( (string) $request->get_param( 'name' ) );
	$settings = os3dt_presets_look_only( $request->get_param( 'settings' ) );
	if ( '' === $name ) {
		return new WP_Error( 'os3dt_preset_name', __( 'Preset name is required.', 'openstudios-3d-text' ), array( 'status' => 400 ) );
	}

	$preset = array(
		'id'        => os3dt_presets_new_id(),
		'name'      => $name,
		'settings'  => $settings,
		'thumbHash' => sanitize_text_field( (string) $request->get_param( 'thumbHash' ) ),
		'thumbW'    => (int) $request->get_param( 'thumbW' ),
		'thumbH'    => (int) $request->get_param( 'thumbH' ),
		'updatedAt' => time(),
	);

	$all   = os3dt_presets_all();
	$all[] = $preset;
	os3dt_presets_save_all( $all );

	return rest_ensure_response( $preset );
}

/**
 * @param WP_REST_Request $request Request.
 * @return WP_REST_Response|WP_Error
 */
function os3dt_rest_presets_update( WP_REST_Request $request ) {
	$id  = (string) $request['id'];
	$all = os3dt_presets_all();
	$idx = null;
	foreach ( $all as $i => $preset ) {
		if ( ( $preset['id'] ?? '' ) === $id ) {
			$idx = $i;
			break;
		}
	}
	if ( null === $idx ) {
		return new WP_Error( 'os3dt_preset_missing', __( 'Preset not found.', 'openstudios-3d-text' ), array( 'status' => 404 ) );
	}

	$preset = $all[ $idx ];
	if ( null !== $request->get_param( 'name' ) ) {
		$name = sanitize_text_field( (string) $request->get_param( 'name' ) );
		if ( '' !== $name ) {
			$preset['name'] = $name;
		}
	}
	if ( null !== $request->get_param( 'settings' ) ) {
		$preset['settings']  = os3dt_presets_look_only( $request->get_param( 'settings' ) );
		$preset['thumbHash'] = sanitize_text_field( (string) $request->get_param( 'thumbHash' ) );
		$preset['thumbW']    = (int) $request->get_param( 'thumbW' );
		$preset['thumbH']    = (int) $request->get_param( 'thumbH' );
	} elseif ( null !== $request->get_param( 'thumbHash' ) ) {
		$preset['thumbHash'] = sanitize_text_field( (string) $request->get_param( 'thumbHash' ) );
		$preset['thumbW']    = (int) $request->get_param( 'thumbW' );
		$preset['thumbH']    = (int) $request->get_param( 'thumbH' );
	}
	$preset['updatedAt'] = time();
	$all[ $idx ]         = $preset;
	os3dt_presets_save_all( $all );

	return rest_ensure_response( $preset );
}

/**
 * @param WP_REST_Request $request Request.
 * @return WP_REST_Response|WP_Error
 */
function os3dt_rest_presets_delete( WP_REST_Request $request ) {
	$id     = (string) $request['id'];
	$all    = os3dt_presets_all();
	$kept   = array();
	$removed = null;
	foreach ( $all as $preset ) {
		if ( ( $preset['id'] ?? '' ) === $id ) {
			$removed = $preset;
			continue;
		}
		$kept[] = $preset;
	}
	if ( ! $removed ) {
		return new WP_Error( 'os3dt_preset_missing', __( 'Preset not found.', 'openstudios-3d-text' ), array( 'status' => 404 ) );
	}
	if ( ! empty( $removed['thumbHash'] ) ) {
		os3dt_cache_delete( (string) $removed['thumbHash'] );
	}
	os3dt_presets_save_all( $kept );
	return rest_ensure_response( array( 'deleted' => true ) );
}
