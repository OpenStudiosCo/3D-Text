<?php
/**
 * Plugin-owned WebP cache under uploads/os3dt-cache/.
 *
 * @package OpenStudios_3D_Text
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Max edge length in CSS×DPR pixels. */
define( 'OS3DT_CACHE_MAX_EDGE', 4096 );

/** Max upload body size in bytes. */
define( 'OS3DT_CACHE_MAX_BYTES', 2 * 1024 * 1024 );

/**
 * Absolute directory for cache files.
 *
 * @return string
 */
function os3dt_cache_dir() {
	$uploads = wp_upload_dir();
	$dir     = trailingslashit( $uploads['basedir'] ) . 'os3dt-cache';

	if ( ! file_exists( $dir ) ) {
		wp_mkdir_p( $dir );
		$index = trailingslashit( $dir ) . 'index.php';
		if ( ! file_exists( $index ) ) {
			file_put_contents( $index, "<?php\n// Silence is golden.\n" );
		}
	}

	return $dir;
}

/**
 * Public base URL for cache files.
 *
 * @return string
 */
function os3dt_cache_url_base() {
	$uploads = wp_upload_dir();
	return trailingslashit( $uploads['baseurl'] ) . 'os3dt-cache';
}

/**
 * Validate a SHA-256 hex hash.
 *
 * @param string $hash Hash string.
 * @return bool
 */
function os3dt_cache_is_valid_hash( $hash ) {
	return is_string( $hash ) && (bool) preg_match( '/^[a-f0-9]{64}$/', $hash );
}

/**
 * Absolute path for a cache WebP.
 *
 * @param string $hash Hash.
 * @return string|WP_Error
 */
function os3dt_cache_webp_path( $hash ) {
	if ( ! os3dt_cache_is_valid_hash( $hash ) ) {
		return new WP_Error( 'os3dt_invalid_hash', __( 'Invalid cache hash.', 'openstudios-3d-text' ), array( 'status' => 400 ) );
	}
	return trailingslashit( os3dt_cache_dir() ) . $hash . '.webp';
}

/**
 * Absolute path for a cache sidecar JSON.
 *
 * @param string $hash Hash.
 * @return string|WP_Error
 */
function os3dt_cache_meta_path( $hash ) {
	if ( ! os3dt_cache_is_valid_hash( $hash ) ) {
		return new WP_Error( 'os3dt_invalid_hash', __( 'Invalid cache hash.', 'openstudios-3d-text' ), array( 'status' => 400 ) );
	}
	return trailingslashit( os3dt_cache_dir() ) . $hash . '.json';
}

/**
 * Public URL for a cache WebP.
 *
 * @param string $hash Hash.
 * @return string|WP_Error
 */
function os3dt_cache_url( $hash ) {
	if ( ! os3dt_cache_is_valid_hash( $hash ) ) {
		return new WP_Error( 'os3dt_invalid_hash', __( 'Invalid cache hash.', 'openstudios-3d-text' ), array( 'status' => 400 ) );
	}
	return trailingslashit( os3dt_cache_url_base() ) . $hash . '.webp';
}

/**
 * Whether a cache file exists.
 *
 * @param string $hash Hash.
 * @return bool
 */
function os3dt_cache_exists( $hash ) {
	$path = os3dt_cache_webp_path( $hash );
	return ! is_wp_error( $path ) && file_exists( $path );
}

/**
 * Read sidecar metadata.
 *
 * @param string $hash Hash.
 * @return array<string, mixed>|null
 */
function os3dt_cache_read_meta( $hash ) {
	$path = os3dt_cache_meta_path( $hash );
	if ( is_wp_error( $path ) || ! file_exists( $path ) ) {
		return null;
	}
	$data = json_decode( (string) file_get_contents( $path ), true );
	return is_array( $data ) ? $data : null;
}

/**
 * Sniff WebP RIFF header.
 *
 * @param string $bytes File contents.
 * @return bool
 */
function os3dt_cache_is_webp( $bytes ) {
	if ( strlen( $bytes ) < 12 ) {
		return false;
	}
	return 'RIFF' === substr( $bytes, 0, 4 ) && 'WEBP' === substr( $bytes, 8, 4 );
}

/**
 * Canonical JSON for a cache-key payload (matches JS serialiseCacheKey).
 *
 * @param array<string, mixed> $payload Payload.
 * @return string|WP_Error
 */
function os3dt_cache_serialise_key( $payload ) {
	if ( ! is_array( $payload ) ) {
		return new WP_Error( 'os3dt_bad_key', __( 'Invalid cache key.', 'openstudios-3d-text' ), array( 'status' => 400 ) );
	}

	$settings = isset( $payload['settings'] ) && is_array( $payload['settings'] )
		? $payload['settings']
		: array();

	$round = static function ( $value ) {
		return round( (float) $value, 6 );
	};

	$canonical = array(
		'renderVersion'      => isset( $payload['renderVersion'] ) ? (int) $payload['renderVersion'] : 1,
		'plainText'          => isset( $payload['plainText'] ) ? (string) $payload['plainText'] : '',
		'settings'           => array(
			'rotateX'    => isset( $settings['rotateX'] ) ? $round( $settings['rotateX'] ) : 0,
			'rotateY'    => isset( $settings['rotateY'] ) ? $round( $settings['rotateY'] ) : 0,
			'rotateZ'    => isset( $settings['rotateZ'] ) ? $round( $settings['rotateZ'] ) : 0,
			'offsetX'    => isset( $settings['offsetX'] ) ? $round( $settings['offsetX'] ) : 0,
			'offsetY'    => isset( $settings['offsetY'] ) ? $round( $settings['offsetY'] ) : 0,
			'sizeScale'  => isset( $settings['sizeScale'] ) ? $round( $settings['sizeScale'] ) : 1,
			'depth'      => isset( $settings['depth'] ) ? $round( $settings['depth'] ) : 0.08,
			'bevel'      => isset( $settings['bevel'] ) ? $round( $settings['bevel'] ) : 0,
			'fontFamily' => isset( $settings['fontFamily'] ) ? (string) $settings['fontFamily'] : 'helvetiker',
			'fontWeight' => isset( $settings['fontWeight'] ) ? (string) $settings['fontWeight'] : 'regular',
			'textColor'  => isset( $settings['textColor'] ) ? (string) $settings['textColor'] : '',
			'shiny'      => ! empty( $settings['shiny'] ),
		),
		'resolvedFontSizePx' => isset( $payload['resolvedFontSizePx'] ) ? $round( $payload['resolvedFontSizePx'] ) : 16,
		'resolvedColor'      => isset( $payload['resolvedColor'] ) ? (string) $payload['resolvedColor'] : '#1c1c1c',
	);

	$json = wp_json_encode( $canonical, JSON_UNESCAPED_SLASHES );
	if ( ! is_string( $json ) ) {
		return new WP_Error( 'os3dt_bad_key', __( 'Could not serialise cache key.', 'openstudios-3d-text' ), array( 'status' => 400 ) );
	}
	return $json;
}

/**
 * SHA-256 hex of a key payload.
 *
 * @param array<string, mixed> $payload Payload.
 * @return string|WP_Error
 */
function os3dt_cache_hash_key( $payload ) {
	$json = os3dt_cache_serialise_key( $payload );
	if ( is_wp_error( $json ) ) {
		return $json;
	}
	return hash( 'sha256', $json );
}

/**
 * Store a WebP capture.
 *
 * @param string               $client_hash Client-provided hash.
 * @param string               $bytes       File bytes.
 * @param int                  $width       Layout width.
 * @param int                  $height      Layout height.
 * @param array<string, mixed> $key         Cache-key payload.
 * @param int                  $post_id     Related post ID when known.
 * @return array<string, mixed>|WP_Error
 */
function os3dt_cache_store( $client_hash, $bytes, $width, $height, $key, $post_id = 0 ) {
	$expected = os3dt_cache_hash_key( $key );
	if ( is_wp_error( $expected ) ) {
		return $expected;
	}

	if ( ! os3dt_cache_is_valid_hash( $client_hash ) || $client_hash !== $expected ) {
		return new WP_Error( 'os3dt_hash_mismatch', __( 'Cache hash does not match the key payload.', 'openstudios-3d-text' ), array( 'status' => 400 ) );
	}

	$width  = (int) $width;
	$height = (int) $height;
	if ( $width < 1 || $height < 1 || $width > OS3DT_CACHE_MAX_EDGE || $height > OS3DT_CACHE_MAX_EDGE ) {
		return new WP_Error( 'os3dt_bad_dimensions', __( 'Image dimensions are outside allowed limits.', 'openstudios-3d-text' ), array( 'status' => 400 ) );
	}

	$size = strlen( $bytes );
	if ( $size < 1 || $size > OS3DT_CACHE_MAX_BYTES ) {
		return new WP_Error( 'os3dt_bad_size', __( 'Image file size is outside allowed limits.', 'openstudios-3d-text' ), array( 'status' => 400 ) );
	}

	if ( ! os3dt_cache_is_webp( $bytes ) ) {
		return new WP_Error( 'os3dt_not_webp', __( 'Upload is not a valid WebP image.', 'openstudios-3d-text' ), array( 'status' => 400 ) );
	}

	$path = os3dt_cache_webp_path( $client_hash );
	$meta = os3dt_cache_meta_path( $client_hash );
	if ( is_wp_error( $path ) || is_wp_error( $meta ) ) {
		return is_wp_error( $path ) ? $path : $meta;
	}

	$url = os3dt_cache_url( $client_hash );
	if ( is_wp_error( $url ) ) {
		return $url;
	}

	if ( file_exists( $path ) ) {
		$existing = os3dt_cache_read_meta( $client_hash );
		return array(
			'hash'   => $client_hash,
			'url'    => $url,
			'w'      => isset( $existing['w'] ) ? (int) $existing['w'] : $width,
			'h'      => isset( $existing['h'] ) ? (int) $existing['h'] : $height,
			'dedupe' => true,
		);
	}

	$dir = os3dt_cache_dir();
	$tmp = trailingslashit( $dir ) . $client_hash . '.webp.tmp';

	// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
	if ( false === file_put_contents( $tmp, $bytes ) ) {
		return new WP_Error( 'os3dt_write_failed', __( 'Could not write cache file.', 'openstudios-3d-text' ), array( 'status' => 500 ) );
	}

	if ( ! rename( $tmp, $path ) ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
		@unlink( $tmp );
		return new WP_Error( 'os3dt_write_failed', __( 'Could not finalise cache file.', 'openstudios-3d-text' ), array( 'status' => 500 ) );
	}

	$sidecar = array(
		'w'             => $width,
		'h'             => $height,
		'bytes'         => $size,
		'created'       => time(),
		'renderVersion' => isset( $key['renderVersion'] ) ? (int) $key['renderVersion'] : 1,
	);
	$meta_tmp = trailingslashit( $dir ) . $client_hash . '.json.tmp';
	// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
	file_put_contents( $meta_tmp, wp_json_encode( $sidecar ) );
	rename( $meta_tmp, $meta );

	if ( $post_id > 0 ) {
		clean_post_cache( $post_id );
	}
	/**
	 * Fires after a cache WebP is stored.
	 *
	 * @param int    $post_id Post ID when known.
	 * @param string $hash    Cache hash.
	 */
	do_action( 'os3dt_cache_updated', $post_id, $client_hash );

	return array(
		'hash'   => $client_hash,
		'url'    => $url,
		'w'      => $width,
		'h'      => $height,
		'dedupe' => false,
	);
}

/**
 * Delete one cache entry.
 *
 * @param string $hash Hash.
 * @return true|WP_Error
 */
function os3dt_cache_delete( $hash ) {
	$path = os3dt_cache_webp_path( $hash );
	$meta = os3dt_cache_meta_path( $hash );
	if ( is_wp_error( $path ) ) {
		return $path;
	}
	if ( file_exists( $path ) ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
		unlink( $path );
	}
	if ( ! is_wp_error( $meta ) && file_exists( $meta ) ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
		unlink( $meta );
	}
	return true;
}

/**
 * Remove all cache files.
 *
 * @return int Number of WebP files removed.
 */
function os3dt_cache_purge_all() {
	$dir   = os3dt_cache_dir();
	$count = 0;
	foreach ( glob( trailingslashit( $dir ) . '*.webp' ) ?: array() as $file ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
		if ( unlink( $file ) ) {
			++$count;
		}
	}
	foreach ( glob( trailingslashit( $dir ) . '*.json' ) ?: array() as $file ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
		unlink( $file );
	}
	return $count;
}
