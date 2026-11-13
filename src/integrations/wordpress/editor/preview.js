import { useEffect, useRef } from '@wordpress/element';
import { TextScene } from '../../../scene/text-scene';
import { resolveFontUrl } from '../../../type/fonts';
import { settingsFromAttributes } from '../../../type/settings';

/**
 * Resolve the real text node used for type / spacing metrics.
 *
 * @param {import('react').RefObject<HTMLElement|null>} measureRef
 * @return {HTMLElement|null}
 */
function resolveReference( measureRef ) {
	const root = measureRef?.current;
	if ( ! root ) {
		return null;
	}
	return (
		root.querySelector( '.wp-block-openstudios-three-d-text__content' ) ||
		root
	);
}

/**
 * Editor preview surface: mounts Three.js while visible, tears it down on leave.
 *
 * @param {Object} props
 * @param {string} props.html
 * @param {Object} props.attributes
 * @param {import('react').RefObject<HTMLElement|null>} props.measureRef
 * @return {JSX.Element}
 */
export default function Preview( { html, attributes, measureRef } ) {
	const hostRef = useRef( null );
	const sceneRef = useRef( null );
	const htmlRef = useRef( html );
	const attributesRef = useRef( attributes );
	htmlRef.current = html;
	attributesRef.current = attributes;

	const settings = settingsFromAttributes( attributes );
	const fontUrl = resolveFontUrl(
		settings.fontFamily,
		settings.fontWeight
	);

	useEffect( () => {
		const host = hostRef.current;
		if ( ! host || ! fontUrl ) {
			return undefined;
		}

		let cancelled = false;
		const referenceEl =
			resolveReference( measureRef ) || host.parentElement;
		const initialSettings = settingsFromAttributes(
			attributesRef.current
		);

		TextScene.mount( host, {
			fontUrl: resolveFontUrl(
				initialSettings.fontFamily,
				initialSettings.fontWeight
			),
			initialHtml: htmlRef.current,
			referenceEl,
			settings: initialSettings,
		} )
			.then( ( scene ) => {
				if ( cancelled ) {
					scene.dispose();
					return;
				}
				sceneRef.current = scene;
				// Apply whatever the sidebar has now (mount is async).
				const latest = settingsFromAttributes( attributesRef.current );
				scene.setSettings(
					latest,
					resolveFontUrl( latest.fontFamily, latest.fontWeight )
				);
				scene.update( htmlRef.current );
			} )
			.catch( () => {
				// Font or WebGL failure — leave the empty host; edit mode still works.
			} );

		return () => {
			cancelled = true;
			if ( sceneRef.current ) {
				sceneRef.current.dispose();
				sceneRef.current = null;
			}
		};
		// Mount once per preview session; settings flow through setSettings below.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ measureRef ] );

	useEffect( () => {
		if ( sceneRef.current ) {
			sceneRef.current.update( html );
		}
	}, [ html ] );

	useEffect( () => {
		if ( ! sceneRef.current ) {
			return;
		}
		const next = settingsFromAttributes( attributes );
		const nextFont = resolveFontUrl( next.fontFamily, next.fontWeight );
		sceneRef.current.setSettings( next, nextFont );
	}, [ attributes ] );

	return (
		<div
			ref={ hostRef }
			className="wp-block-openstudios-three-d-text__preview"
			aria-hidden="true"
		/>
	);
}
