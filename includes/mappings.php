<?php
/**
 * Preset → core/heading mappings and precache candidates.
 *
 * @package OpenStudios_3D_Text
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const OS3DT_MAPPINGS_OPTION = 'os3dt_mappings';

/**
 * @return array<int, array<string, mixed>>
 */
function os3dt_mappings_all() {
	$raw = get_option( OS3DT_MAPPINGS_OPTION, array() );
	return is_array( $raw ) ? array_values( $raw ) : array();
}

/**
 * @param array<int, array<string, mixed>> $mappings Mappings.
 */
function os3dt_mappings_save_all( $mappings ) {
	update_option( OS3DT_MAPPINGS_OPTION, array_values( $mappings ), false );
}

/**
 * Pick the best mapping for a heading.
 *
 * @param int    $level Heading level 1–6.
 * @param string $class Block className.
 * @return array<string, mixed>|null
 */
function os3dt_mappings_match( $level, $class ) {
	$level = (int) $level;
	$class = (string) $class;
	$tokens = preg_split( '/\s+/', trim( $class ) ) ?: array();

	$candidates = array();
	foreach ( os3dt_mappings_all() as $map ) {
		$map_level = isset( $map['level'] ) ? (int) $map['level'] : 0;
		if ( $map_level !== $level ) {
			continue;
		}
		$token = isset( $map['classToken'] ) ? trim( (string) $map['classToken'] ) : '';
		if ( '' !== $token && ! in_array( $token, $tokens, true ) ) {
			continue;
		}
		$specificity = '' !== $token ? 2 : 1;
		$candidates[] = array(
			'specificity' => $specificity,
			'id'          => (string) ( $map['id'] ?? '' ),
			'map'         => $map,
		);
	}

	if ( ! $candidates ) {
		return null;
	}

	usort(
		$candidates,
		static function ( $a, $b ) {
			if ( $a['specificity'] !== $b['specificity'] ) {
				return $b['specificity'] <=> $a['specificity'];
			}
			return strcmp( $a['id'], $b['id'] );
		}
	);

	return $candidates[0]['map'];
}

/**
 * @param WP_REST_Request $request Request.
 * @return WP_REST_Response
 */
function os3dt_rest_mappings_list( WP_REST_Request $request ) {
	return rest_ensure_response( os3dt_mappings_all() );
}

/**
 * Replace the full mappings list.
 *
 * @param WP_REST_Request $request Request.
 * @return WP_REST_Response|WP_Error
 */
function os3dt_rest_mappings_save( WP_REST_Request $request ) {
	$incoming = $request->get_param( 'mappings' );
	if ( ! is_array( $incoming ) ) {
		return new WP_Error( 'os3dt_bad_mappings', __( 'Mappings payload must be an array.', 'openstudios-3d-text' ), array( 'status' => 400 ) );
	}

	$clean = array();
	foreach ( $incoming as $row ) {
		if ( ! is_array( $row ) ) {
			continue;
		}
		$id = isset( $row['id'] ) ? sanitize_key( (string) $row['id'] ) : '';
		if ( '' === $id ) {
			$id = 'm_' . wp_generate_password( 10, false, false );
		}
		$level = isset( $row['level'] ) ? (int) $row['level'] : 0;
		if ( $level < 1 || $level > 6 ) {
			continue;
		}
		$preset_id = sanitize_text_field( (string) ( $row['presetId'] ?? '' ) );
		if ( '' === $preset_id || ! os3dt_presets_get( $preset_id ) ) {
			continue;
		}
		$cache_by_text = array();
		if ( isset( $row['cacheByText'] ) && is_array( $row['cacheByText'] ) ) {
			foreach ( $row['cacheByText'] as $text => $hash ) {
				$text = sanitize_text_field( (string) $text );
				$hash = (string) $hash;
				if ( '' !== $text && os3dt_cache_is_valid_hash( $hash ) ) {
					$cache_by_text[ $text ] = $hash;
				}
			}
		}
		$clean[] = array(
			'id'          => $id,
			'presetId'    => $preset_id,
			'level'       => $level,
			'classToken'  => sanitize_html_class( (string) ( $row['classToken'] ?? '' ) ),
			'cacheByText' => $cache_by_text,
		);
	}

	os3dt_mappings_save_all( $clean );
	return rest_ensure_response( $clean );
}

/**
 * List heading candidates on a post for precache.
 *
 * @param WP_REST_Request $request Request.
 * @return WP_REST_Response|WP_Error
 */
function os3dt_rest_precache_candidates( WP_REST_Request $request ) {
	$post_id = (int) $request['id'];
	$post    = get_post( $post_id );
	if ( ! $post ) {
		return new WP_Error( 'os3dt_no_post', __( 'Post not found.', 'openstudios-3d-text' ), array( 'status' => 404 ) );
	}

	$blocks = parse_blocks( $post->post_content );
	$out    = array();
	os3dt_walk_blocks_for_precache( $blocks, $out );

	return rest_ensure_response(
		array(
			'postId'     => $post_id,
			'matchCount' => count( $out ),
			'candidates' => $out,
		)
	);
}

/**
 * @param array<int, array<string, mixed>> $blocks Blocks.
 * @param array<int, array<string, mixed>> $out    Collector.
 */
function os3dt_walk_blocks_for_precache( $blocks, &$out ) {
	foreach ( $blocks as $block ) {
		$name = $block['blockName'] ?? null;
		if ( 'core/heading' === $name ) {
			$attrs = is_array( $block['attrs'] ?? null ) ? $block['attrs'] : array();
			$class = isset( $attrs['className'] ) ? (string) $attrs['className'] : '';
			if ( false !== strpos( $class, 'os3dt-skip' ) ) {
				continue;
			}
			$level = isset( $attrs['level'] ) ? (int) $attrs['level'] : 2;
			$map   = os3dt_mappings_match( $level, $class );
			if ( ! $map ) {
				continue;
			}
			$plain = wp_strip_all_tags( (string) ( $block['innerHTML'] ?? '' ) );
			$plain = trim( preg_replace( '/\s+/', ' ', $plain ) ?: '' );
			$preset = os3dt_presets_get( $map['presetId'] ?? '' );
			$hash   = isset( $map['cacheByText'][ $plain ] ) ? (string) $map['cacheByText'][ $plain ] : '';
			$status = ( os3dt_cache_is_valid_hash( $hash ) && os3dt_cache_exists( $hash ) ) ? 'cached' : 'pending';
			$out[]  = array(
				'level'      => $level,
				'className'  => $class,
				'plainText'  => $plain,
				'mappingId'  => $map['id'] ?? '',
				'presetId'   => $map['presetId'] ?? '',
				'settings'   => $preset['settings'] ?? array(),
				'cacheHash'  => $hash,
				'status'     => $status,
			);
		}
		if ( ! empty( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
			os3dt_walk_blocks_for_precache( $block['innerBlocks'], $out );
		}
	}
}
