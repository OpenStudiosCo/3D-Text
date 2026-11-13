/**
 * Shared defaults and helpers for 3D Text scene settings.
 */

export const DEFAULT_SETTINGS = {
	rotateX: -6,
	rotateY: 16,
	rotateZ: 0,
	offsetX: 0,
	offsetY: 0,
	sizeScale: 1,
	depth: 0.08,
	bevel: 0,
	fontFamily: 'helvetiker',
	fontWeight: 'regular',
	textColor: '',
	shiny: false,
};

/**
 * Pick scene settings from block attributes.
 *
 * @param {Object} attributes
 * @return {Object}
 */
export function settingsFromAttributes( attributes ) {
	return {
		rotateX: Number( attributes.rotateX ?? DEFAULT_SETTINGS.rotateX ),
		rotateY: Number( attributes.rotateY ?? DEFAULT_SETTINGS.rotateY ),
		rotateZ: Number( attributes.rotateZ ?? DEFAULT_SETTINGS.rotateZ ),
		offsetX: Number( attributes.offsetX ?? DEFAULT_SETTINGS.offsetX ),
		offsetY: Number( attributes.offsetY ?? DEFAULT_SETTINGS.offsetY ),
		sizeScale: Number(
			attributes.sizeScale ?? DEFAULT_SETTINGS.sizeScale
		),
		depth: Number( attributes.depth ?? DEFAULT_SETTINGS.depth ),
		bevel: Number( attributes.bevel ?? DEFAULT_SETTINGS.bevel ),
		fontFamily: attributes.fontFamily || DEFAULT_SETTINGS.fontFamily,
		fontWeight: attributes.fontWeight || DEFAULT_SETTINGS.fontWeight,
		textColor: attributes.textColor || '',
		shiny: Boolean( attributes.shiny ),
	};
}

/**
 * Serialise settings onto a block wrapper as data-os3dt-* attributes.
 *
 * @param {Object} settings
 * @return {Object}
 */
export function settingsToDataset( settings ) {
	return {
		'data-os3dt-rotate-x': String( settings.rotateX ),
		'data-os3dt-rotate-y': String( settings.rotateY ),
		'data-os3dt-rotate-z': String( settings.rotateZ ),
		'data-os3dt-offset-x': String( settings.offsetX ),
		'data-os3dt-offset-y': String( settings.offsetY ),
		'data-os3dt-size-scale': String( settings.sizeScale ),
		'data-os3dt-depth': String( settings.depth ),
		'data-os3dt-bevel': String( settings.bevel ),
		'data-os3dt-font-family': settings.fontFamily,
		'data-os3dt-font-weight': settings.fontWeight,
		'data-os3dt-text-color': settings.textColor || '',
		'data-os3dt-shiny': settings.shiny ? '1' : '0',
	};
}

/**
 * Read settings from a mounted block element.
 *
 * @param {HTMLElement} el
 * @return {Object}
 */
export function settingsFromDataset( el ) {
	const num = ( name, fallback ) => {
		const raw = el.getAttribute( name );
		if ( raw === null || raw === '' ) {
			return fallback;
		}
		const n = Number( raw );
		return Number.isFinite( n ) ? n : fallback;
	};

	return {
		rotateX: num( 'data-os3dt-rotate-x', DEFAULT_SETTINGS.rotateX ),
		rotateY: num( 'data-os3dt-rotate-y', DEFAULT_SETTINGS.rotateY ),
		rotateZ: num( 'data-os3dt-rotate-z', DEFAULT_SETTINGS.rotateZ ),
		offsetX: num( 'data-os3dt-offset-x', DEFAULT_SETTINGS.offsetX ),
		offsetY: num( 'data-os3dt-offset-y', DEFAULT_SETTINGS.offsetY ),
		sizeScale: num(
			'data-os3dt-size-scale',
			DEFAULT_SETTINGS.sizeScale
		),
		depth: num( 'data-os3dt-depth', DEFAULT_SETTINGS.depth ),
		bevel: num( 'data-os3dt-bevel', DEFAULT_SETTINGS.bevel ),
		fontFamily:
			el.getAttribute( 'data-os3dt-font-family' ) ||
			DEFAULT_SETTINGS.fontFamily,
		fontWeight:
			el.getAttribute( 'data-os3dt-font-weight' ) ||
			DEFAULT_SETTINGS.fontWeight,
		textColor: el.getAttribute( 'data-os3dt-text-color' ) || '',
		shiny: el.getAttribute( 'data-os3dt-shiny' ) === '1',
	};
}

/**
 * Keys that require rebuilding TextGeometry / reloading a font.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {boolean}
 */
export function needsGeometryRebuild( a, b ) {
	return (
		a.depth !== b.depth ||
		a.bevel !== b.bevel ||
		a.sizeScale !== b.sizeScale ||
		a.fontFamily !== b.fontFamily ||
		a.fontWeight !== b.fontWeight
	);
}
