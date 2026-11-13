import { useBlockProps, RichText } from '@wordpress/block-editor';
import { toPlainText } from './three/plainText';
import { contentTag } from './contentTag';

/**
 * Saved markup: accessible text fallback plus a mount point for viewScript.
 *
 * @param {Object} props
 * @param {Object} props.attributes
 * @param {string} props.attributes.content
 * @param {number} props.attributes.level
 * @return {JSX.Element}
 */
export default function save( { attributes } ) {
	const { content, level } = attributes;
	const Tag = contentTag( level );
	const plain = toPlainText( content );
	const blockProps = useBlockProps.save( {
		className: 'wp-block-openstudios-three-d-text',
		'data-os3dt-text': plain,
		'data-os3dt-level': String( level || 0 ),
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
