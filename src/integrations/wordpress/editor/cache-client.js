/**
 * REST helpers for the plugin-owned WebP cache.
 */

import apiFetch from '@wordpress/api-fetch';
import {
	cacheKeyFromAttributes,
	hashCacheKey,
	serialiseCacheKey,
} from '../../../type/cache-key';

/**
 * Upload a captured WebP into the plugin cache.
 *
 * @param {Object} options
 * @param {Blob}   options.blob
 * @param {Object} options.attributes
 * @param {{ fontSize: number, color: string }} options.metrics
 * @param {number} options.width
 * @param {number} options.height
 * @param {number} [options.postId]
 * @return {Promise<{ hash: string, url: string, w: number, h: number }>}
 */
export async function uploadCacheWebp( {
	blob,
	attributes,
	metrics,
	width,
	height,
	postId = 0,
} ) {
	const key = cacheKeyFromAttributes( attributes, metrics );
	const hash = await hashCacheKey( key );

	const body = new FormData();
	body.append( 'file', blob, `${ hash }.webp` );
	body.append( 'hash', hash );
	body.append( 'w', String( width ) );
	body.append( 'h', String( height ) );
	body.append( 'key', serialiseCacheKey( key ) );
	if ( postId ) {
		body.append( 'postId', String( postId ) );
	}

	return apiFetch( {
		path: '/os3dt/v1/cache',
		method: 'POST',
		body,
	} );
}

/**
 * Capture from a live TextScene and upload.
 *
 * @param {import('../../../scene/text-scene').TextScene} scene
 * @param {Object} attributes
 * @param {number} [postId]
 * @return {Promise<{ cacheHash: string, cacheWidth: number, cacheHeight: number }>}
 */
export async function generateAndUpload( scene, attributes, postId = 0 ) {
	const captured = await scene.captureFrame();
	const metrics = scene.getTypeMetrics();
	const result = await uploadCacheWebp( {
		blob: captured.blob,
		attributes,
		metrics,
		width: captured.width,
		height: captured.height,
		postId,
	} );
	return {
		cacheHash: result.hash,
		cacheWidth: result.w || captured.width,
		cacheHeight: result.h || captured.height,
	};
}
