import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { toPlainText } from './plainText';
import { DEFAULT_SETTINGS, needsGeometryRebuild } from '../settings';

/** Extra room around glyphs so bevel/pose is not clipped. */
const FRAME_MARGIN = 1.08;

const DEG = Math.PI / 180;

/**
 * @typedef {Object} TextSceneHandle
 * @property {(html: string) => void} update
 * @property {(next: Object) => Promise<void>} setSettings
 * @property {() => void} dispose
 */

/**
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
 * @param {boolean} shiny
 * @return {{ metalness: number, roughness: number }}
 */
function materialFinish( shiny ) {
	return shiny
		? { metalness: 0.85, roughness: 0.2 }
		: { metalness: 0.05, roughness: 0.65 };
}

/**
 * Load a typeface via FontLoader.
 *
 * @param {string} fontUrl
 * @return {Promise<import('three/addons/loaders/FontLoader.js').Font>}
 */
function loadFont( fontUrl ) {
	return new Promise( ( resolve, reject ) => {
		new FontLoader().load( fontUrl, resolve, undefined, reject );
	} );
}

/**
 * Mount a Three.js scene that extrudes plain text at roughly the original type size.
 *
 * @param {HTMLElement} container
 * @param {Object}      options
 * @param {string}      options.fontUrl
 * @param {string}      [options.initialHtml]
 * @param {HTMLElement} [options.referenceEl]
 * @param {Object}      [options.settings]
 * @return {Promise<TextSceneHandle>}
 */
export async function createTextScene(
	container,
	{ fontUrl, initialHtml = '', referenceEl, settings: initialSettings = {} }
) {
	const type = measureType( container, referenceEl );
	applyInheritedBox( container, type );

	let settings = { ...DEFAULT_SETTINGS, ...initialSettings };
	let currentFontUrl = fontUrl;
	let font = await loadFont( currentFontUrl );
	let html = initialHtml;

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
	scene.add( root );

	let mesh = null;
	let disposed = false;

	const paint = () => {
		if ( ! disposed ) {
			renderer.render( scene, camera );
		}
	};

	const applyPose = () => {
		root.rotation.set(
			settings.rotateX * DEG,
			settings.rotateY * DEG,
			settings.rotateZ * DEG
		);
		if ( mesh ) {
			mesh.position.set( settings.offsetX, settings.offsetY, 0 );
		}
	};

	const applyAppearance = () => {
		if ( ! mesh ) {
			return;
		}
		const colour = settings.textColor || type.color;
		mesh.material.color.set( colour );
		const finish = materialFinish( settings.shiny );
		mesh.material.metalness = finish.metalness;
		mesh.material.roughness = finish.roughness;
		mesh.material.needsUpdate = true;
	};

	/**
	 * Size the canvas from the posed bounds. Only shrink if wider than the content column.
	 */
	const fitToText = () => {
		if ( ! mesh ) {
			return;
		}

		const baseScale = mesh.userData.baseScale || 1;
		mesh.scale.setScalar( baseScale );
		root.updateWorldMatrix( true, true );
		const box = new THREE.Box3().setFromObject( root );
		const size = box.getSize( new THREE.Vector3() );

		let w = Math.max( Math.ceil( size.x * FRAME_MARGIN ), 1 );
		let h = Math.max( Math.ceil( size.y * FRAME_MARGIN ), 1 );

		const maxW = getColumnMaxWidth( container );
		if ( maxW > 0 && w > maxW ) {
			const s = maxW / w;
			w = maxW;
			h = Math.max( Math.ceil( h * s ), 1 );
			mesh.scale.setScalar( baseScale * s );
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

	const rebuildGeometry = () => {
		const text = toPlainText( html ) || '3D Text';

		if ( mesh ) {
			root.remove( mesh );
			mesh.geometry.dispose();
			mesh.material.dispose();
			mesh = null;
		}

		const depth = Math.max( type.fontSize * settings.depth, 0.5 );
		const bevelEnabled = settings.bevel > 0;
		const bevelSize = bevelEnabled
			? Math.max( type.fontSize * settings.bevel, 0.15 )
			: 0;

		const geometry = new TextGeometry( text, {
			font,
			size: type.fontSize,
			depth,
			curveSegments: 6,
			bevelEnabled,
			bevelThickness: bevelSize,
			bevelSize: bevelSize * 0.75,
			bevelOffset: 0,
			bevelSegments: bevelEnabled ? 2 : 0,
		} );
		geometry.computeBoundingBox();
		geometry.center();

		const finish = materialFinish( settings.shiny );
		const material = new THREE.MeshStandardMaterial( {
			color: new THREE.Color( settings.textColor || type.color ),
			metalness: finish.metalness,
			roughness: finish.roughness,
		} );

		mesh = new THREE.Mesh( geometry, material );
		mesh.userData.baseScale = 1;
		root.add( mesh );

		applyPose();
		fitToText();
		paint();
	};

	rebuildGeometry();

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
		update( nextHtml ) {
			html = nextHtml;
			rebuildGeometry();
		},

		async setSettings( nextSettings, nextFontUrl ) {
			const previous = settings;
			settings = { ...DEFAULT_SETTINGS, ...nextSettings };

			const fontChanged =
				nextFontUrl && nextFontUrl !== currentFontUrl;
			const rebuild =
				fontChanged || needsGeometryRebuild( previous, settings );

			if ( fontChanged ) {
				currentFontUrl = nextFontUrl;
				font = await loadFont( currentFontUrl );
			}

			if ( rebuild ) {
				rebuildGeometry();
				return;
			}

			applyPose();
			applyAppearance();
			fitToText();
			paint();
		},

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
