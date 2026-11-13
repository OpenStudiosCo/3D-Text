/**
 * Canonical cache-key payload for WebP captures.
 * PHP re-hashes the same JSON shape when validating uploads.
 */

import { DEFAULT_SETTINGS, settingsFromAttributes } from './settings';
import { toPlainText } from './plain-text';

/** Bump when capture maths or key fields change. */
export const CACHE_RENDER_VERSION = 1;

/**
 * Normalise a CSS colour to #rrggbb lowercase.
 *
 * @param {string} colour
 * @return {string}
 */
export function normaliseHexColour( colour ) {
	if ( ! colour ) {
		return '#1c1c1c';
	}
	const raw = String( colour ).trim();
	const short = raw.match( /^#([0-9a-f]{3})$/i );
	if ( short ) {
		const [ r, g, b ] = short[ 1 ].split( '' );
		return `#${ r }${ r }${ g }${ g }${ b }${ b }`.toLowerCase();
	}
	const full = raw.match( /^#([0-9a-f]{6})$/i );
	if ( full ) {
		return `#${ full[ 1 ] }`.toLowerCase();
	}
	if ( typeof document !== 'undefined' ) {
		const el = document.createElement( 'div' );
		el.style.color = raw;
		document.body.appendChild( el );
		const computed = getComputedStyle( el ).color;
		document.body.removeChild( el );
		const rgb = computed.match(
			/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i
		);
		if ( rgb ) {
			const hex = ( n ) =>
				Number( n ).toString( 16 ).padStart( 2, '0' );
			return `#${ hex( rgb[ 1 ] ) }${ hex( rgb[ 2 ] ) }${ hex(
				rgb[ 3 ]
			) }`;
		}
	}
	return '#1c1c1c';
}

/**
 * Build the canonical cache-key object (stable field order).
 *
 * @param {Object} options
 * @param {string} options.plainText
 * @param {Object} options.settings
 * @param {number} options.resolvedFontSizePx
 * @param {string} options.resolvedColor
 * @return {Object}
 */
/**
 * Round a number for stable cross-runtime JSON hashing.
 *
 * @param {unknown} value
 * @return {number}
 */
function roundKeyNumber( value ) {
	const n = Number( value );
	if ( ! Number.isFinite( n ) ) {
		return 0;
	}
	return Math.round( n * 1e6 ) / 1e6;
}

export function buildCacheKeyPayload( {
	plainText,
	settings,
	resolvedFontSizePx,
	resolvedColor,
} ) {
	const s = { ...DEFAULT_SETTINGS, ...settings };
	return {
		renderVersion: CACHE_RENDER_VERSION,
		plainText: String( plainText || '' ),
		settings: {
			rotateX: roundKeyNumber( s.rotateX ),
			rotateY: roundKeyNumber( s.rotateY ),
			rotateZ: roundKeyNumber( s.rotateZ ),
			offsetX: roundKeyNumber( s.offsetX ),
			offsetY: roundKeyNumber( s.offsetY ),
			sizeScale: roundKeyNumber( s.sizeScale ),
			depth: roundKeyNumber( s.depth ),
			bevel: roundKeyNumber( s.bevel ),
			fontFamily: String( s.fontFamily ),
			fontWeight: String( s.fontWeight ),
			textColor: String( s.textColor || '' ),
			shiny: Boolean( s.shiny ),
		},
		resolvedFontSizePx: roundKeyNumber( resolvedFontSizePx ),
		resolvedColor: normaliseHexColour( resolvedColor ),
	};
}

/**
 * Build a cache-key payload from block attributes and resolved metrics.
 *
 * @param {Object} attributes
 * @param {{ fontSize: number, color: string }} metrics
 * @return {Object}
 */
export function cacheKeyFromAttributes( attributes, metrics ) {
	return buildCacheKeyPayload( {
		plainText: toPlainText( attributes.content || '' ),
		settings: settingsFromAttributes( attributes ),
		resolvedFontSizePx: metrics.fontSize,
		resolvedColor: metrics.color,
	} );
}

/**
 * Stable JSON serialisation for hashing (sorted top-level already fixed).
 *
 * @param {Object} payload
 * @return {string}
 */
export function serialiseCacheKey( payload ) {
	return JSON.stringify( payload );
}

/**
 * SHA-256 hex digest of the canonical key JSON.
 *
 * @param {Object} payload
 * @return {Promise<string>}
 */
export async function hashCacheKey( payload ) {
	const json = serialiseCacheKey( payload );
	const data = new TextEncoder().encode( json );
	const digest = await crypto.subtle.digest( 'SHA-256', data );
	return [ ...new Uint8Array( digest ) ]
		.map( ( b ) => b.toString( 16 ).padStart( 2, '0' ) )
		.join( '' );
}

/**
 * Attribute patch that clears a stored image reference.
 *
 * @return {{ cacheHash: string, cacheWidth: number, cacheHeight: number }}
 */
export function clearedCacheAttributes() {
	return {
		cacheHash: '',
		cacheWidth: 0,
		cacheHeight: 0,
	};
}
