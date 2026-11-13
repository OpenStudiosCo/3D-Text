import { TextScene } from '../../../scene/text-scene';
import { resolveFontUrl } from '../../../type/fonts';
import { settingsFromDataset } from '../../../type/settings';

/**
 * Front-end: replace each block's fallback text with a live Three.js preview,
 * unless a server-emitted cached WebP is already present.
 */
export function mountBlocks() {
	const blocks = document.querySelectorAll(
		'.wp-block-openstudios-three-d-text:not([data-os3dt-mounted])'
	);

	blocks.forEach( ( block ) => {
		if (
			block.getAttribute( 'data-os3dt-cached' ) === '1' ||
			block.classList.contains( 'is-cached' )
		) {
			const img = block.querySelector(
				'.wp-block-openstudios-three-d-text__image'
			);
			if ( img ) {
				block.dataset.os3dtMounted = 'true';
				block.classList.add( 'is-preview', 'is-cached' );
				img.addEventListener(
					'error',
					() => {
						block.classList.remove( 'is-cached' );
						block.removeAttribute( 'data-os3dt-cached' );
						img.remove();
						delete block.dataset.os3dtMounted;
						mountOne( block );
					},
					{ once: true }
				);
				return;
			}
		}

		mountOne( block );
	} );
}

/**
 * @param {HTMLElement} block
 */
function mountOne( block ) {
	if ( block.dataset.os3dtMounted === 'true' ) {
		return;
	}

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
}
