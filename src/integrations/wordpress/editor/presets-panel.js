import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import {
	PanelBody,
	Button,
	TextControl,
	Spinner,
	Notice,
} from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { TextScene } from '../../../scene/text-scene';
import { resolveFontUrl } from '../../../type/fonts';
import {
	DEFAULT_SETTINGS,
	settingsFromAttributes,
} from '../../../type/settings';
import { uploadCacheWebp } from './cache-client';

const SAMPLE_TEXT = 'Sample text';

/**
 * Look-only settings for presets (offsets excluded).
 *
 * @param {Object} attributes
 * @return {Object}
 */
function lookFromAttributes( attributes ) {
	const s = settingsFromAttributes( attributes );
	return {
		rotateX: s.rotateX,
		rotateY: s.rotateY,
		rotateZ: s.rotateZ,
		sizeScale: s.sizeScale,
		depth: s.depth,
		bevel: s.bevel,
		fontFamily: s.fontFamily,
		fontWeight: s.fontWeight,
		textColor: s.textColor,
		shiny: s.shiny,
	};
}

/**
 * Capture a Sample text thumbnail using the current block metrics.
 *
 * @param {Object} options
 * @param {Object} options.look
 * @param {HTMLElement|null} options.referenceEl
 * @param {number} options.postId
 * @return {Promise<{ thumbHash: string, thumbW: number, thumbH: number }>}
 */
async function captureSampleThumb( { look, referenceEl, postId } ) {
	const host = document.createElement( 'div' );
	host.style.cssText =
		'position:fixed;left:-10000px;top:0;width:auto;height:auto;opacity:0;pointer-events:none;';
	document.body.appendChild( host );

	const ref = document.createElement( 'div' );
	const fontSize = referenceEl
		? parseFloat( getComputedStyle( referenceEl ).fontSize ) || 48
		: 48;
	const color = look.textColor ||
		( referenceEl
			? getComputedStyle( referenceEl ).color
			: '#1c1c1c' );
	ref.style.cssText = `font-size:${ fontSize }px;color:${ color };`;
	document.body.appendChild( ref );

	const fontUrl = resolveFontUrl( look.fontFamily, look.fontWeight );
	const settings = {
		...DEFAULT_SETTINGS,
		...look,
		offsetX: 0,
		offsetY: 0,
	};

	let scene;
	try {
		scene = await TextScene.mount( host, {
			fontUrl,
			initialHtml: SAMPLE_TEXT,
			referenceEl: ref,
			settings,
		} );
		const captured = await scene.captureFrame();
		const metrics = scene.getTypeMetrics();
		const result = await uploadCacheWebp( {
			blob: captured.blob,
			attributes: {
				content: SAMPLE_TEXT,
				...settings,
			},
			metrics,
			width: captured.width,
			height: captured.height,
			postId,
		} );
		return {
			thumbHash: result.hash,
			thumbW: result.w || captured.width,
			thumbH: result.h || captured.height,
		};
	} finally {
		if ( scene ) {
			scene.dispose();
		}
		host.remove();
		ref.remove();
	}
}

/**
 * Save / apply look presets.
 *
 * @param {Object} props
 * @return {JSX.Element}
 */
export default function PresetsPanel( {
	attributes,
	setAttributes,
	measureRef,
	postId = 0,
} ) {
	const [ presets, setPresets ] = useState( [] );
	const [ name, setName ] = useState( '' );
	const [ busy, setBusy ] = useState( false );
	const [ error, setError ] = useState( '' );
	const [ loading, setLoading ] = useState( true );

	const load = async () => {
		setLoading( true );
		try {
			const list = await apiFetch( { path: '/os3dt/v1/presets' } );
			setPresets( Array.isArray( list ) ? list : [] );
		} catch ( err ) {
			setError(
				err?.message ||
					__( 'Could not load presets.', 'openstudios-3d-text' )
			);
		} finally {
			setLoading( false );
		}
	};

	useEffect( () => {
		load();
	}, [] );

	const onSavePreset = async () => {
		setError( '' );
		const trimmed = name.trim();
		if ( ! trimmed ) {
			setError(
				__( 'Enter a name for this preset.', 'openstudios-3d-text' )
			);
			return;
		}
		setBusy( true );
		try {
			const referenceEl =
				measureRef?.current?.querySelector?.(
					'.wp-block-openstudios-three-d-text__content'
				) || measureRef?.current;
			const look = lookFromAttributes( attributes );
			const thumb = await captureSampleThumb( {
				look,
				referenceEl,
				postId,
			} );
			await apiFetch( {
				path: '/os3dt/v1/presets',
				method: 'POST',
				data: {
					name: trimmed,
					settings: look,
					...thumb,
				},
			} );
			setName( '' );
			await load();
		} catch ( err ) {
			setError(
				err?.message ||
					__( 'Could not save preset.', 'openstudios-3d-text' )
			);
		} finally {
			setBusy( false );
		}
	};

	const onApply = ( preset ) => {
		const look = preset.settings || {};
		setAttributes( {
			rotateX: look.rotateX ?? DEFAULT_SETTINGS.rotateX,
			rotateY: look.rotateY ?? DEFAULT_SETTINGS.rotateY,
			rotateZ: look.rotateZ ?? DEFAULT_SETTINGS.rotateZ,
			sizeScale: look.sizeScale ?? DEFAULT_SETTINGS.sizeScale,
			depth: look.depth ?? DEFAULT_SETTINGS.depth,
			bevel: look.bevel ?? DEFAULT_SETTINGS.bevel,
			fontFamily: look.fontFamily ?? DEFAULT_SETTINGS.fontFamily,
			fontWeight: look.fontWeight ?? DEFAULT_SETTINGS.fontWeight,
			textColor: look.textColor ?? '',
			shiny: !! look.shiny,
			presetId: preset.id || '',
		} );
	};

	const onDelete = async ( id ) => {
		setBusy( true );
		setError( '' );
		try {
			await apiFetch( {
				path: `/os3dt/v1/presets/${ id }`,
				method: 'DELETE',
			} );
			if ( attributes.presetId === id ) {
				setAttributes( { presetId: '' } );
			}
			await load();
		} catch ( err ) {
			setError(
				err?.message ||
					__( 'Could not delete preset.', 'openstudios-3d-text' )
			);
		} finally {
			setBusy( false );
		}
	};

	return (
		<PanelBody
			title={ __( 'Presets', 'openstudios-3d-text' ) }
			initialOpen={ false }
		>
			{ error ? (
				<Notice status="error" isDismissible={ false }>
					{ error }
				</Notice>
			) : null }
			<TextControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'Preset name', 'openstudios-3d-text' ) }
				value={ name }
				onChange={ setName }
			/>
			<Button
				variant="secondary"
				onClick={ onSavePreset }
				disabled={ busy }
				isBusy={ busy }
			>
				{ __( 'Save as preset', 'openstudios-3d-text' ) }
			</Button>
			{ loading ? <Spinner /> : null }
			<ul className="os3dt-presets-list">
				{ presets.map( ( preset ) => (
					<li key={ preset.id } className="os3dt-presets-list__item">
						{ preset.thumbUrl ? (
							<img
								src={ preset.thumbUrl }
								alt=""
								width={ preset.thumbW || 120 }
								height={ preset.thumbH || 40 }
							/>
						) : null }
						<strong>{ preset.name }</strong>
						<div className="os3dt-presets-list__actions">
							<Button
								variant="tertiary"
								onClick={ () => onApply( preset ) }
							>
								{ __( 'Apply', 'openstudios-3d-text' ) }
							</Button>
							<Button
								variant="tertiary"
								isDestructive
								onClick={ () => onDelete( preset.id ) }
							>
								{ __( 'Delete', 'openstudios-3d-text' ) }
							</Button>
						</div>
					</li>
				) ) }
			</ul>
		</PanelBody>
	);
}
