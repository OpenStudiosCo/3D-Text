import { useBlockProps, RichText } from '@wordpress/block-editor';

/**
 * Saved markup: stable paragraph wrapper for content preservation.
 *
 * @param {Object} props
 * @param {Object} props.attributes
 * @param {string} props.attributes.content
 * @return {JSX.Element} Block save element.
 */
export default function save( { attributes } ) {
	const { content } = attributes;
	const blockProps = useBlockProps.save( {
		className: 'wp-block-openstudios-three-d-text',
	} );

	return (
		<p { ...blockProps }>
			<RichText.Content value={ content } />
		</p>
	);
}
