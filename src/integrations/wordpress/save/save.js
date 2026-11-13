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
	const { content, level } = attributes;
	const Tag = contentTag( level );
	const plain = toPlainText( content );
	const settings = settingsFromAttributes( attributes );
	const blockProps = useBlockProps.save( {
		className: 'wp-block-openstudios-three-d-text',
		'data-os3dt-text': plain,
		'data-os3dt-level': String( level || 0 ),
		...settingsToDataset( settings ),
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
