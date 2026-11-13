import { __ } from '@wordpress/i18n';
import { useState, useRef, useCallback } from '@wordpress/element';
import {
	useBlockProps,
	RichText,
	BlockControls,
} from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import Preview from './preview';
import Inspector from './inspector';
import TagToolbar from './tag-toolbar';
import { contentTag } from '../../../type/content-tag';
import { clearedCacheAttributes } from '../../../type/cache-key';
import { generateAndUpload } from './cache-client';
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
 * Clear stored image reference whenever text or look/placement changes.
 *
 * @param {Object} patch Attribute patch.
 * @return {Object}
 */
function withClearedCache( patch ) {
	return {
		...patch,
		...clearedCacheAttributes(),
	};
}

/**
 * Editor: text mode keeps RichText; preview mode swaps in the Three.js canvas.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 * @return {JSX.Element}
 */
export default function Edit( { attributes, setAttributes } ) {
	const { content, level, cacheHash } = attributes;
	const [ mode, setMode ] = useState( 'preview' );
	const [ generating, setGenerating ] = useState( false );
	const [ generateError, setGenerateError ] = useState( '' );
	const measureRef = useRef( null );
	const previewRef = useRef( null );
	const tagName = contentTag( level );
	const postId = useSelect( ( select ) => {
		const editor = select( 'core/editor' );
		return editor?.getCurrentPostId?.() || 0;
	}, [] );

	const blockProps = useBlockProps( {
		className:
			'wp-block-openstudios-three-d-text is-' +
			( mode === 'preview' ? 'preview' : 'edit' ) +
			( cacheHash ? ' is-cached' : '' ),
	} );

	const updateAttributes = useCallback(
		( patch ) => {
			const keys = Object.keys( patch || {} );
			const metaOnly =
				keys.length > 0 &&
				keys.every( ( key ) =>
					[ 'cacheHash', 'cacheWidth', 'cacheHeight', 'presetId' ].includes(
						key
					)
				);
			setAttributes( metaOnly ? patch : withClearedCache( patch ) );
		},
		[ setAttributes ]
	);

	const onContentChange = useCallback(
		( next ) => {
			updateAttributes( { content: next } );
		},
		[ updateAttributes ]
	);

	const onGenerate = useCallback( async () => {
		setGenerateError( '' );
		setGenerating( true );
		try {
			if ( mode !== 'preview' ) {
				setMode( 'preview' );
			}
			const scene = await previewRef.current?.whenReady?.();
			if ( ! scene ) {
				throw Object.assign( new Error( 'Preview is not ready.' ), {
					code: 'encode_failed',
				} );
			}
			const next = await generateAndUpload( scene, attributes, postId );
			setAttributes( next );
		} catch ( err ) {
			const code = err?.code || err?.data?.code || '';
			if ( code === 'webp_unsupported' ) {
				setGenerateError(
					__(
						'This browser could not encode WebP. Keep using live 3D preview.',
						'openstudios-3d-text'
					)
				);
			} else {
				setGenerateError(
					err?.message ||
						__(
							'Could not generate WebP cache.',
							'openstudios-3d-text'
						)
				);
			}
		} finally {
			setGenerating( false );
		}
	}, [ attributes, mode, postId, setAttributes ] );

	return (
		<>
			<Inspector
				attributes={ attributes }
				setAttributes={ updateAttributes }
				onGenerate={ onGenerate }
				generating={ generating }
				generateError={ generateError }
				previewRef={ previewRef }
				measureRef={ measureRef }
				postId={ postId }
			/>
			<BlockControls group="block">
				<TagToolbar
					level={ level }
					onChange={ ( nextLevel ) =>
						updateAttributes( { level: nextLevel } )
					}
				/>
			</BlockControls>
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
						onChange={ onContentChange }
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
					<Preview
						ref={ previewRef }
						html={ content }
						attributes={ attributes }
						measureRef={ measureRef }
					/>
				) }
			</div>
		</>
	);
}
