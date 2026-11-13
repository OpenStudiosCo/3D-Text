import { useBlockProps, RichText } from '@wordpress/block-editor';
import { toPlainText } from '../../../type/plain-text';
import { contentTag } from '../../../type/content-tag';
import {
	settingsFromAttributes,
	settingsToDataset,
} from '../../../type/settings';

/**
 * Saved markup: accessible text fallback plus a mount point for viewScript.
 *
 * @param {Object} props
 * @param {Object} props.attributes
 * @return {JSX.Element}
 */
export default function save( { attributes } ) {
	const {
		content,
		level,
		cacheHash,
		cacheWidth,
		cacheHeight,
		presetId,
	} = attributes;
	const Tag = contentTag( level );
	const plain = toPlainText( content );
	const settings = settingsFromAttributes( attributes );
	const cacheAttrs = {};
	if ( cacheHash ) {
		cacheAttrs[ 'data-os3dt-cache' ] = cacheHash;
		cacheAttrs[ 'data-os3dt-cache-w' ] = String( cacheWidth || 0 );
		cacheAttrs[ 'data-os3dt-cache-h' ] = String( cacheHeight || 0 );
	}
	if ( presetId ) {
		cacheAttrs[ 'data-os3dt-preset' ] = presetId;
	}
	const blockProps = useBlockProps.save( {
		className: 'wp-block-openstudios-three-d-text',
		'data-os3dt-text': plain,
		'data-os3dt-level': String( level || 0 ),
		...settingsToDataset( settings ),
		...cacheAttrs,
	} );

	return (
		<div { ...blockProps }>
			<Tag className="wp-block-openstudios-three-d-text__content">
				<RichText.Content value={ content } />
			</Tag>
			<div
				className="wp-block-openstudios-three-d-text__canvas"
				aria-hidden="true"
			/>
		</div>
	);
}
