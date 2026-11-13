import { createTextScene } from './three/createTextScene';
import { getConfig } from './config';

/**
 * Front-end: replace each block's fallback text with a live Three.js preview.
 */
function mountBlocks() {
	const { fontUrl } = getConfig();
	if ( ! fontUrl ) {
		return;
	}

	const blocks = document.querySelectorAll(
		'.wp-block-openstudios-three-d-text:not([data-os3dt-mounted])'
	);

	blocks.forEach( ( block ) => {
		const canvas = block.querySelector(
			'.wp-block-openstudios-three-d-text__canvas'
		);
		const content = block.querySelector(
			'.wp-block-openstudios-three-d-text__content'
		);
		if ( ! canvas ) {
			return;
		}

		const html =
			content?.innerHTML ||
			block.getAttribute( 'data-os3dt-text' ) ||
			'';

		block.dataset.os3dtMounted = 'true';
		block.classList.add( 'is-preview' );

		// Measure the real text node before / while it is visually hidden.
		createTextScene( canvas, {
			fontUrl,
			initialHtml: html,
			referenceEl: content || block,
		} ).catch( () => {
			block.classList.remove( 'is-preview' );
			delete block.dataset.os3dtMounted;
		} );
	} );
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', mountBlocks );
} else {
	mountBlocks();
}
