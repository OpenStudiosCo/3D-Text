import { createRoot, useEffect, useState } from '@wordpress/element';
import {
	Button,
	SelectControl,
	TextControl,
	Spinner,
	Notice,
} from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { TextScene } from './scene/text-scene';
import { resolveFontUrl } from './type/fonts';
import { DEFAULT_SETTINGS } from './type/settings';
import { uploadCacheWebp } from './integrations/wordpress/editor/cache-client';
import './admin.scss';

/**
 * Admin UI for mappings and one-page precache.
 */
function AdminApp() {
	const [ presets, setPresets ] = useState( [] );
	const [ mappings, setMappings ] = useState( [] );
	const [ postId, setPostId ] = useState( '' );
	const [ candidates, setCandidates ] = useState( [] );
	const [ matchCount, setMatchCount ] = useState( 0 );
	const [ status, setStatus ] = useState( '' );
	const [ error, setError ] = useState( '' );
	const [ busy, setBusy ] = useState( false );

	const load = async () => {
		const [ p, m ] = await Promise.all( [
			apiFetch( { path: '/os3dt/v1/presets' } ),
			apiFetch( { path: '/os3dt/v1/mappings' } ),
		] );
		setPresets( Array.isArray( p ) ? p : [] );
		setMappings( Array.isArray( m ) ? m : [] );
	};

	useEffect( () => {
		load().catch( ( err ) => setError( err?.message || String( err ) ) );
	}, [] );

	const addMapping = () => {
		const presetId = presets[ 0 ]?.id || '';
		setMappings( ( prev ) => [
			...prev,
			{
				id: `m_${ Date.now() }`,
				presetId,
				level: 1,
				classToken: '',
				cacheByText: {},
			},
		] );
	};

	const saveMappings = async () => {
		setBusy( true );
		setError( '' );
		try {
			const saved = await apiFetch( {
				path: '/os3dt/v1/mappings',
				method: 'POST',
				data: { mappings },
			} );
			setMappings( Array.isArray( saved ) ? saved : [] );
			setStatus( __( 'Mappings saved.', 'openstudios-3d-text' ) );
		} catch ( err ) {
			setError( err?.message || String( err ) );
		} finally {
			setBusy( false );
		}
	};

	const loadCandidates = async () => {
		setBusy( true );
		setError( '' );
		try {
			const data = await apiFetch( {
				path: `/os3dt/v1/precache/${ Number( postId ) }`,
			} );
			setMatchCount( data.matchCount || 0 );
			setCandidates( data.candidates || [] );
		} catch ( err ) {
			setError( err?.message || String( err ) );
		} finally {
			setBusy( false );
		}
	};

	const runPrecache = async () => {
		setBusy( true );
		setError( '' );
		const nextMappings = mappings.map( ( m ) => ( {
			...m,
			cacheByText: { ...( m.cacheByText || {} ) },
		} ) );
		const updated = [];

		for ( const candidate of candidates ) {
			const row = { ...candidate, status: 'pending' };
			try {
				const host = document.createElement( 'div' );
				host.style.cssText =
					'position:fixed;left:-10000px;top:0;opacity:0;pointer-events:none;';
				const ref = document.createElement( 'h' + candidate.level );
				ref.textContent = candidate.plainText;
				ref.style.fontSize = `${ 24 + ( 7 - candidate.level ) * 4 }px`;
				document.body.appendChild( host );
				document.body.appendChild( ref );

				const look = {
					...DEFAULT_SETTINGS,
					...( candidate.settings || {} ),
					offsetX: 0,
					offsetY: 0,
				};
				const fontUrl = resolveFontUrl(
					look.fontFamily,
					look.fontWeight
				);
				const scene = await TextScene.mount( host, {
					fontUrl,
					initialHtml: candidate.plainText,
					referenceEl: ref,
					settings: look,
				} );
				const captured = await scene.captureFrame();
				const metrics = scene.getTypeMetrics();
				const result = await uploadCacheWebp( {
					blob: captured.blob,
					attributes: {
						content: candidate.plainText,
						...look,
					},
					metrics,
					width: captured.width,
					height: captured.height,
					postId: Number( postId ) || 0,
				} );
				scene.dispose();
				host.remove();
				ref.remove();

				const map = nextMappings.find(
					( m ) => m.id === candidate.mappingId
				);
				if ( map ) {
					map.cacheByText[ candidate.plainText ] = result.hash;
				}
				row.status = 'cached';
				row.cacheHash = result.hash;
			} catch ( err ) {
				row.status = 'failed';
				row.error = err?.message || String( err );
			}
			updated.push( row );
			setCandidates( [ ...updated, ...candidates.slice( updated.length ) ] );
		}

		try {
			const saved = await apiFetch( {
				path: '/os3dt/v1/mappings',
				method: 'POST',
				data: { mappings: nextMappings },
			} );
			setMappings( Array.isArray( saved ) ? saved : nextMappings );
			setStatus(
				__( 'Precache finished and mappings updated.', 'openstudios-3d-text' )
			);
		} catch ( err ) {
			setError( err?.message || String( err ) );
		} finally {
			setBusy( false );
		}
	};

	return (
		<div className="os3dt-admin">
			{ error ? (
				<Notice status="error" isDismissible={ false }>
					{ error }
				</Notice>
			) : null }
			{ status ? (
				<Notice status="success" isDismissible={ false }>
					{ status }
				</Notice>
			) : null }

			<section>
				<h2>{ __( 'Heading mappings', 'openstudios-3d-text' ) }</h2>
				<p>
					{ __(
						'Map a preset to core/heading by level and optional class token. Use class os3dt-skip to opt out.',
						'openstudios-3d-text'
					) }
				</p>
				{ mappings.map( ( map, index ) => (
					<div className="os3dt-admin__row" key={ map.id }>
						<SelectControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Level', 'openstudios-3d-text' ) }
							value={ String( map.level ) }
							options={ [ 1, 2, 3, 4, 5, 6 ].map( ( n ) => ( {
								label: `H${ n }`,
								value: String( n ),
							} ) ) }
							onChange={ ( value ) => {
								const next = [ ...mappings ];
								next[ index ] = {
									...map,
									level: Number( value ),
								};
								setMappings( next );
							} }
						/>
						<SelectControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Preset', 'openstudios-3d-text' ) }
							value={ map.presetId }
							options={ [
								{
									label: __(
										'Select preset',
										'openstudios-3d-text'
									),
									value: '',
								},
								...presets.map( ( p ) => ( {
									label: p.name,
									value: p.id,
								} ) ),
							] }
							onChange={ ( value ) => {
								const next = [ ...mappings ];
								next[ index ] = {
									...map,
									presetId: value,
								};
								setMappings( next );
							} }
						/>
						<TextControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __(
								'Class token (optional)',
								'openstudios-3d-text'
							) }
							value={ map.classToken || '' }
							onChange={ ( value ) => {
								const next = [ ...mappings ];
								next[ index ] = {
									...map,
									classToken: value,
								};
								setMappings( next );
							} }
						/>
						<Button
							isDestructive
							variant="tertiary"
							onClick={ () =>
								setMappings(
									mappings.filter( ( m ) => m.id !== map.id )
								)
							}
						>
							{ __( 'Remove', 'openstudios-3d-text' ) }
						</Button>
					</div>
				) ) }
				<p>
					<Button variant="secondary" onClick={ addMapping }>
						{ __( 'Add mapping', 'openstudios-3d-text' ) }
					</Button>{ ' ' }
					<Button
						variant="primary"
						onClick={ saveMappings }
						disabled={ busy }
					>
						{ __( 'Save mappings', 'openstudios-3d-text' ) }
					</Button>
				</p>
			</section>

			<section>
				<h2>{ __( 'Precache one post', 'openstudios-3d-text' ) }</h2>
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Post ID', 'openstudios-3d-text' ) }
					value={ postId }
					onChange={ setPostId }
				/>
				<p>
					<Button
						variant="secondary"
						onClick={ loadCandidates }
						disabled={ busy || ! postId }
					>
						{ __( 'Find matches', 'openstudios-3d-text' ) }
					</Button>{ ' ' }
					<Button
						variant="primary"
						onClick={ runPrecache }
						disabled={ busy || ! candidates.length }
					>
						{ __( 'Run precache', 'openstudios-3d-text' ) }
					</Button>
				</p>
				{ busy ? <Spinner /> : null }
				<p>
					{ __( 'Match count:', 'openstudios-3d-text' ) }{ ' ' }
					<strong>{ matchCount }</strong>
				</p>
				<ul>
					{ candidates.map( ( c, i ) => (
						<li key={ `${ c.mappingId }-${ i }` }>
							H{ c.level }: “{ c.plainText }” — { c.status }
							{ c.error ? ` (${ c.error })` : '' }
						</li>
					) ) }
				</ul>
			</section>
		</div>
	);
}

const rootEl = document.getElementById( 'os3dt-admin-root' );
if ( rootEl ) {
	createRoot( rootEl ).render( <AdminApp /> );
}
