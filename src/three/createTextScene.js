import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { toPlainText } from './plainText';

/** Extra room around glyphs so bevel/pose is not clipped. */
const FRAME_MARGIN = 1.08;

/**
 * @typedef {Object} TextSceneHandle
 * @property {(html: string) => void} update
 * @property {() => void} dispose
 */

/**
 * Content column width — never the fit-content block itself (that causes a shrink loop).
 *
 * @param {HTMLElement} container
 * @return {number}
 */
function getColumnMaxWidth( container ) {
	const column = container.closest(
		'.is-root-container, .editor-styles-wrapper, .wp-block-post-content, .entry-content, article'
	);
	if ( column && column.clientWidth > 0 ) {
		return column.clientWidth;
	}
	return window.innerWidth || 0;
}

/**
 * Read type and box metrics from the original text element (heading or paragraph).
 *
 * @param {HTMLElement} container
 * @param {HTMLElement} [referenceEl]
 */
function measureType( container, referenceEl ) {
	const el = referenceEl || container.parentElement || container;
	const style = window.getComputedStyle( el );
	const fontSize = parseFloat( style.fontSize ) || 16;
	let lineHeight = parseFloat( style.lineHeight );
	if ( ! lineHeight || Number.isNaN( lineHeight ) ) {
		lineHeight = fontSize * 1.2;
	}

	return {
		fontSize,
		lineHeight,
		color: style.color || '#1c1c1c',
		marginTop: style.marginTop,
		marginBottom: style.marginBottom,
		paddingTop: style.paddingTop,
		paddingRight: style.paddingRight,
		paddingBottom: style.paddingBottom,
		paddingLeft: style.paddingLeft,
	};
}

/**
 * Match vertical rhythm from the reference text; stay left within the block.
 * Do not touch horizontal margins — Gutenberg owns those on `.wp-block`.
 *
 * @param {HTMLElement} container
 * @param {ReturnType<typeof measureType>} type
 */
function applyInheritedBox( container, type ) {
	container.style.display = 'block';
	container.style.width = 'fit-content';
	container.style.maxWidth = '100%';
	container.style.background = 'transparent';
	container.style.lineHeight = '0';
	container.style.marginTop = type.marginTop;
	container.style.marginBottom = type.marginBottom;
	container.style.marginLeft = '0';
	container.style.marginRight = '0';
	container.style.paddingTop = type.paddingTop;
	container.style.paddingRight = type.paddingRight;
	container.style.paddingBottom = type.paddingBottom;
	container.style.paddingLeft = type.paddingLeft;
}

/**
 * Mount a Three.js scene that extrudes plain text at roughly the original type size.
 *
 * @param {HTMLElement} container
 * @param {Object}      options
 * @param {string}      options.fontUrl
 * @param {string}      [options.initialHtml]
 * @param {HTMLElement} [options.referenceEl]
 * @return {Promise<TextSceneHandle>}
 */
export async function createTextScene(
	container,
	{ fontUrl, initialHtml = '', referenceEl }
) {
	const type = measureType( container, referenceEl );
	applyInheritedBox( container, type );

	const scene = new THREE.Scene();
	scene.background = null;

	const camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0.1, 1000 );
	camera.position.set( 0, 0, 500 );

	const renderer = new THREE.WebGLRenderer( {
		antialias: true,
		alpha: true,
		premultipliedAlpha: false,
	} );
	renderer.setClearColor( 0x000000, 0 );
	renderer.setPixelRatio( Math.min( window.devicePixelRatio || 1, 2 ) );
	container.appendChild( renderer.domElement );
	renderer.domElement.style.display = 'block';

	scene.add( new THREE.AmbientLight( 0xffffff, 0.9 ) );
	const key = new THREE.DirectionalLight( 0xffffff, 1.05 );
	key.position.set( 120, 180, 320 );
	scene.add( key );
	const fill = new THREE.DirectionalLight( 0xdde4ff, 0.4 );
	fill.position.set( -160, -40, 120 );
	scene.add( fill );

	const root = new THREE.Group();
	// Fixed pose so extrusion reads as 3D without motion.
	root.rotation.set( -0.1, 0.28, 0 );
	scene.add( root );

	const font = await new Promise( ( resolve, reject ) => {
		new FontLoader().load( fontUrl, resolve, undefined, reject );
	} );

	let mesh = null;
	let disposed = false;

	const paint = () => {
		if ( ! disposed ) {
			renderer.render( scene, camera );
		}
	};

	/**
	 * Size the canvas to the glyph bounds. Only shrink if wider than the content column.
	 */
	const fitToText = () => {
		if ( ! mesh ) {
			return;
		}

		mesh.scale.set( 1, 1, 1 );
		mesh.updateWorldMatrix( true, false );
		const box = new THREE.Box3().setFromObject( mesh );
		const size = box.getSize( new THREE.Vector3() );

		let w = Math.max( Math.ceil( size.x * FRAME_MARGIN ), 1 );
		let h = Math.max( Math.ceil( size.y * FRAME_MARGIN ), 1 );

		const maxW = getColumnMaxWidth( container );
		if ( maxW > 0 && w > maxW ) {
			const s = maxW / w;
			w = maxW;
			h = Math.max( Math.ceil( h * s ), 1 );
			mesh.scale.setScalar( s );
		}

		container.style.width = `${ w }px`;
		container.style.height = `${ h }px`;
		renderer.setSize( w, h, false );

		camera.left = -w / 2;
		camera.right = w / 2;
		camera.top = h / 2;
		camera.bottom = -h / 2;
		camera.updateProjectionMatrix();
		camera.lookAt( 0, 0, 0 );
	};

	const rebuild = ( html ) => {
		const text = toPlainText( html ) || '3D Text';

		if ( mesh ) {
			root.remove( mesh );
			mesh.geometry.dispose();
			if ( Array.isArray( mesh.material ) ) {
				mesh.material.forEach( ( m ) => m.dispose() );
			} else {
				mesh.material.dispose();
			}
			mesh = null;
		}

		const geometry = new TextGeometry( text, {
			font,
			size: type.fontSize,
			depth: Math.max( type.fontSize * 0.2, 2 ),
			curveSegments: 6,
			bevelEnabled: true,
			bevelThickness: Math.max( type.fontSize * 0.035, 0.35 ),
			bevelSize: Math.max( type.fontSize * 0.025, 0.25 ),
			bevelOffset: 0,
			bevelSegments: 2,
		} );
		geometry.computeBoundingBox();
		geometry.center();

		const material = new THREE.MeshStandardMaterial( {
			color: new THREE.Color( type.color ),
			metalness: 0.12,
			roughness: 0.5,
		} );

		mesh = new THREE.Mesh( geometry, material );
		root.add( mesh );

		fitToText();
		paint();
	};

	rebuild( initialHtml );

	const onResize = () => {
		fitToText();
		paint();
	};

	const resizeObserver = new ResizeObserver( onResize );
	const column =
		container.closest(
			'.is-root-container, .editor-styles-wrapper, .wp-block-post-content, .entry-content, article'
		) || document.body;
	resizeObserver.observe( column );

	return {
		update: rebuild,
		dispose() {
			disposed = true;
			resizeObserver.disconnect();
			if ( mesh ) {
				root.remove( mesh );
				mesh.geometry.dispose();
				mesh.material.dispose();
			}
			renderer.dispose();
			if ( renderer.domElement.parentNode === container ) {
				container.removeChild( renderer.domElement );
			}
		},
	};
}
