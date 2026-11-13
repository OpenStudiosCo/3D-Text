import { TextScene } from '../../../scene/text-scene';
import { resolveFontUrl } from '../../../type/fonts';
import { settingsFromDataset } from '../../../type/settings';

/**
 * Front-end: replace each block's fallback text with a live Three.js preview.
 */
export function mountBlocks() {
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

		const settings = settingsFromDataset( block );
		const fontUrl = resolveFontUrl(
			settings.fontFamily,
			settings.fontWeight
		);
		if ( ! fontUrl ) {
			return;
		}

		const html =
			content?.innerHTML ||
			block.getAttribute( 'data-os3dt-text' ) ||
			'';

		block.dataset.os3dtMounted = 'true';
		block.classList.add( 'is-preview' );

		TextScene.mount( canvas, {
			fontUrl,
			initialHtml: html,
			referenceEl: content || block,
			settings,
		} ).catch( () => {
			block.classList.remove( 'is-preview' );
			delete block.dataset.os3dtMounted;
		} );
	} );
}
