import { __ } from '@wordpress/i18n';
import { useState, useRef } from '@wordpress/element';
import {
	useBlockProps,
	RichText,
	BlockControls,
} from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import PreviewCanvas from './three/PreviewCanvas';
import { getConfig } from './config';
import { contentTag } from './contentTag';
import './editor.scss';

const editIcon = (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<path d="M20.1 5.1L16.9 2 6.2 12.7l-1.1 4.2 4.2-1.1L20.1 5.1zm-4.1-1.4l2.3 2.3-1.5 1.5-2.3-2.3 1.5-1.5zM6.9 15.1l.7-2.6 1.9 1.9-2.6.7z" />
	</svg>
);

const previewIcon = (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<path d="M12 5c-5.5 0-9.5 5.1-9.9 5.6L2 11l.1.4C2.5 12.9 6.5 18 12 18s9.5-5.1 9.9-5.6l.1-.4-.1-.4C21.5 10.1 17.5 5 12 5zm0 11c-3.6 0-6.7-3.1-7.7-4 1-1 4.1-4 7.7-4s6.7 3.1 7.7 4c-1 1-4.1 4-7.7 4zm0-7a3 3 0 100 6 3 3 0 000-6z" />
	</svg>
);

/**
 * Editor: text mode keeps RichText; preview mode swaps in the Three.js canvas.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {string}   props.attributes.content
 * @param {number}   props.attributes.level
 * @param {Function} props.setAttributes
 * @return {JSX.Element}
 */
export default function Edit( { attributes, setAttributes } ) {
	const { content, level } = attributes;
	const [ mode, setMode ] = useState( 'edit' );
	const measureRef = useRef( null );
	const { fontUrl } = getConfig();
	const tagName = contentTag( level );
	const blockProps = useBlockProps( {
		className:
			'wp-block-openstudios-three-d-text is-' +
			( mode === 'preview' ? 'preview' : 'edit' ),
	} );

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						icon={ editIcon }
						label={ __( 'Edit text', 'openstudios-3d-text' ) }
						isActive={ mode === 'edit' }
						onClick={ () => setMode( 'edit' ) }
					/>
					<ToolbarButton
						icon={ previewIcon }
						label={ __( 'Preview 3D', 'openstudios-3d-text' ) }
						isActive={ mode === 'preview' }
						onClick={ () => setMode( 'preview' ) }
					/>
				</ToolbarGroup>
			</BlockControls>
			<div { ...blockProps }>
				<div
					ref={ measureRef }
					className={
						mode === 'preview'
							? 'wp-block-openstudios-three-d-text__measure'
							: undefined
					}
				>
					<RichText
						tagName={ tagName }
						className="wp-block-openstudios-three-d-text__content"
						value={ content }
						onChange={ ( next ) =>
							setAttributes( { content: next } )
						}
						placeholder={ __(
							'3D Text…',
							'openstudios-3d-text'
						) }
						allowedFormats={ [
							'core/bold',
							'core/italic',
							'core/link',
							'core/strikethrough',
							'core/code',
						] }
					/>
				</div>
				{ mode === 'preview' && (
					<PreviewCanvas
						html={ content }
						fontUrl={ fontUrl }
						measureRef={ measureRef }
					/>
				) }
			</div>
		</>
	);
}
