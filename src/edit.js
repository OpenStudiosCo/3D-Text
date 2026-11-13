import { __ } from '@wordpress/i18n';
import { useBlockProps, RichText } from '@wordpress/block-editor';
import './editor.scss';

/**
 * Editor view: passthrough rich text until real 3D rendering arrives.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {string}   props.attributes.content
 * @param {Function} props.setAttributes
 * @return {JSX.Element} Block edit element.
 */
export default function Edit( { attributes, setAttributes } ) {
	const { content } = attributes;
	const blockProps = useBlockProps( {
		className: 'wp-block-openstudios-three-d-text',
	} );

	return (
		<RichText
			{ ...blockProps }
			tagName="p"
			value={ content }
			onChange={ ( next ) => setAttributes( { content: next } ) }
			placeholder={ __( '3D Text…', 'openstudios-3d-text' ) }
			allowedFormats={ [
				'core/bold',
				'core/italic',
				'core/link',
				'core/strikethrough',
				'core/code',
			] }
		/>
	);
}
