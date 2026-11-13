<?php
/**
 * Front-end render_block filters for cached 3D Text and heading mappings.
 *
 * @package OpenStudios_3D_Text
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Inject decorative WebP for cache hits on the 3D Text block.
 *
 * @param string               $block_content Block HTML.
 * @param array<string, mixed> $block         Parsed block.
 * @return string
 */
function os3dt_render_three_d_text( $block_content, $block ) {
	if ( ( $block['blockName'] ?? '' ) !== 'openstudios/three-d-text' ) {
		return $block_content;
	}

	// Make sure front-end stylesheet is present for cache-hit layout.
	os3dt_enqueue_front_styles();

	$attrs = is_array( $block['attrs'] ?? null ) ? $block['attrs'] : array();
	$hash  = isset( $attrs['cacheHash'] ) ? (string) $attrs['cacheHash'] : '';
	$w     = isset( $attrs['cacheWidth'] ) ? (int) $attrs['cacheWidth'] : 0;
	$h     = isset( $attrs['cacheHeight'] ) ? (int) $attrs['cacheHeight'] : 0;

	if ( ! $hash && preg_match( '/data-os3dt-cache="([a-f0-9]{64})"/', $block_content, $m ) ) {
		$hash = $m[1];
	}
	if ( ! $w && preg_match( '/data-os3dt-cache-w="(\d+)"/', $block_content, $m ) ) {
		$w = (int) $m[1];
	}
	if ( ! $h && preg_match( '/data-os3dt-cache-h="(\d+)"/', $block_content, $m ) ) {
		$h = (int) $m[1];
	}

	if ( ! os3dt_cache_is_valid_hash( $hash ) || ! os3dt_cache_exists( $hash ) ) {
		return $block_content;
	}

	$url = os3dt_cache_url( $hash );
	if ( is_wp_error( $url ) ) {
		return $block_content;
	}

	$meta = os3dt_cache_read_meta( $hash );
	if ( $w < 1 && isset( $meta['w'] ) ) {
		$w = (int) $meta['w'];
	}
	if ( $h < 1 && isset( $meta['h'] ) ) {
		$h = (int) $meta['h'];
	}
	if ( $w < 1 ) {
		$w = 1;
	}
	if ( $h < 1 ) {
		$h = 1;
	}

	$img = sprintf(
		'<img class="wp-block-openstudios-three-d-text__image" src="%s" alt="" decoding="async" width="%d" height="%d" style="display:block;max-width:100%%;height:auto;pointer-events:none" />',
		esc_url( $url ),
		$w,
		$h
	);

	$updated = preg_replace(
		'/(<div class="wp-block-openstudios-three-d-text__canvas"[^>]*>)(<\/div>)/',
		'$1' . $img . '$2',
		$block_content,
		1
	);

	if ( ! is_string( $updated ) || $updated === $block_content ) {
		return $block_content;
	}

	$updated = preg_replace(
		'/class="([^"]*wp-block-openstudios-three-d-text[^"]*)"/',
		'class="$1 is-preview is-cached"',
		$updated,
		1
	);

	if ( false === strpos( $updated, 'data-os3dt-cached=' ) ) {
		$updated = preg_replace(
			'/<div /',
			'<div data-os3dt-cached="1" ',
			$updated,
			1
		);
	}

	// Inline critical layout so cache hits stay correct even if the block stylesheet is deferred or stripped.
	$updated = preg_replace(
		'/(class="[^"]*wp-block-openstudios-three-d-text__content[^"]*")/',
		'$1 style="position:absolute;left:0;top:0;opacity:0;margin:0;z-index:-1;pointer-events:auto"',
		$updated,
		1
	);
	$updated = preg_replace(
		'/(class="[^"]*wp-block-openstudios-three-d-text__canvas[^"]*")/',
		'$1 style="display:block;line-height:0"',
		$updated,
		1
	);

	return is_string( $updated ) ? $updated : $block_content;
}
add_filter( 'render_block', 'os3dt_render_three_d_text', 10, 2 );

/**
 * Apply preset look as cached imagery on matching core/heading blocks.
 *
 * @param string               $block_content Block HTML.
 * @param array<string, mixed> $block         Parsed block.
 * @return string
 */
function os3dt_render_mapped_heading( $block_content, $block ) {
	if ( ( $block['blockName'] ?? '' ) !== 'core/heading' ) {
		return $block_content;
	}

	$attrs = is_array( $block['attrs'] ?? null ) ? $block['attrs'] : array();
	$class = isset( $attrs['className'] ) ? (string) $attrs['className'] : '';
	if ( false !== strpos( $class, 'os3dt-skip' ) || false !== strpos( $block_content, 'os3dt-skip' ) ) {
		return $block_content;
	}

	$level = isset( $attrs['level'] ) ? (int) $attrs['level'] : 2;
	$map   = os3dt_mappings_match( $level, $class );
	if ( ! $map ) {
		return $block_content;
	}

	$preset = os3dt_presets_get( $map['presetId'] ?? '' );
	if ( ! $preset ) {
		return $block_content;
	}

	$plain = wp_strip_all_tags( $block_content );
	$plain = trim( preg_replace( '/\s+/', ' ', $plain ) ?: '' );
	if ( '' === $plain ) {
		return $block_content;
	}

	$hash = isset( $map['cacheByText'][ $plain ] ) ? (string) $map['cacheByText'][ $plain ] : '';
	if ( ! $hash && ! empty( $preset['thumbHash'] ) && 'Sample text' === $plain ) {
		$hash = (string) $preset['thumbHash'];
	}

	// Prefer a pre-generated hash stored on the mapping for this exact text.
	if ( ! os3dt_cache_is_valid_hash( $hash ) || ! os3dt_cache_exists( $hash ) ) {
		return $block_content;
	}

	$url  = os3dt_cache_url( $hash );
	$meta = os3dt_cache_read_meta( $hash );
	if ( is_wp_error( $url ) ) {
		return $block_content;
	}
	$w = isset( $meta['w'] ) ? (int) $meta['w'] : 1;
	$h = isset( $meta['h'] ) ? (int) $meta['h'] : 1;

	$wrapper = sprintf(
		'<div class="os3dt-mapped is-cached" data-os3dt-cached="1">' .
		'<div class="os3dt-mapped__text">%s</div>' .
		'<img class="os3dt-mapped__image" src="%s" alt="" decoding="async" width="%d" height="%d" />' .
		'</div>',
		$block_content,
		esc_url( $url ),
		$w,
		$h
	);

	return $wrapper;
}
add_filter( 'render_block', 'os3dt_render_mapped_heading', 20, 2 );
