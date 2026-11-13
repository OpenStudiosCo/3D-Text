import { useEffect, useRef } from '@wordpress/element';
import { createTextScene } from './createTextScene';

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
 * @param {string} props.fontUrl
 * @param {import('react').RefObject<HTMLElement|null>} props.measureRef
 * @return {JSX.Element}
 */
export default function PreviewCanvas( { html, fontUrl, measureRef } ) {
	const hostRef = useRef( null );
	const sceneRef = useRef( null );
	const htmlRef = useRef( html );
	htmlRef.current = html;

	useEffect( () => {
		const host = hostRef.current;
		if ( ! host || ! fontUrl ) {
			return undefined;
		}

		let cancelled = false;
		const referenceEl = resolveReference( measureRef ) || host.parentElement;

		createTextScene( host, {
			fontUrl,
			initialHtml: htmlRef.current,
			referenceEl,
		} )
			.then( ( scene ) => {
				if ( cancelled ) {
					scene.dispose();
					return;
				}
				sceneRef.current = scene;
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
	}, [ fontUrl, measureRef ] );

	useEffect( () => {
		if ( sceneRef.current ) {
			sceneRef.current.update( html );
		}
	}, [ html ] );

	return (
		<div
			ref={ hostRef }
			className="wp-block-openstudios-three-d-text__preview"
			aria-hidden="true"
		/>
	);
}
