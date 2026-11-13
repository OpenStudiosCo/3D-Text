import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { toPlainText } from '../type/plain-text';
import { DEFAULT_SETTINGS, needsGeometryRebuild } from '../type/settings';

/** Extra room around glyphs so bevel/pose is not clipped. */
const FRAME_MARGIN = 1.08;

const DEG = Math.PI / 180;

/**
 * Mount a Three.js scene that extrudes plain text at roughly the original type size.
 */
export class TextScene {
	/** @type {HTMLElement} */
	#container;
	/** @type {ReturnType<typeof measureType>} */
	#type;
	/** @type {Object} */
	#settings;
	/** @type {string} */
	#currentFontUrl;
	/** @type {import('three/addons/loaders/FontLoader.js').Font} */
	#font;
	/** @type {string} */
	#html;
	/** @type {boolean} */
	#disposed;
	/** @type {THREE.Mesh|null} */
	#mesh;
	/** @type {THREE.Scene} */
	#scene;
	/** @type {THREE.OrthographicCamera} */
	#camera;
	/** @type {THREE.WebGLRenderer} */
	#renderer;
	/** @type {THREE.Group} */
	#root;
	/** @type {ResizeObserver} */
	#resizeObserver;

	/**
	 * @param {HTMLElement} container
	 * @param {Object}      options
	 * @param {string}      options.fontUrl
	 * @param {string}      [options.initialHtml]
	 * @param {HTMLElement} [options.referenceEl]
	 * @param {Object}      [options.settings]
	 * @return {Promise<TextScene>}
	 */
	static async mount(
		container,
		{ fontUrl, initialHtml = '', referenceEl, settings: initialSettings = {} }
	) {
		const scene = new TextScene();
		await scene.#init( container, {
			fontUrl,
			initialHtml,
			referenceEl,
			settings: initialSettings,
		} );
		return scene;
	}

	/**
	 * @param {HTMLElement} container
	 * @param {Object}      options
	 */
	async #init(
		container,
		{ fontUrl, initialHtml, referenceEl, settings: initialSettings }
	) {
		this.#container = container;
		this.#type = measureType( container, referenceEl );
		applyInheritedBox( container, this.#type );

		this.#settings = { ...DEFAULT_SETTINGS, ...initialSettings };
		this.#currentFontUrl = fontUrl;
		this.#font = await loadFont( this.#currentFontUrl );
		this.#html = initialHtml;
		this.#disposed = false;
		this.#mesh = null;

		this.#scene = new THREE.Scene();
		this.#scene.background = null;

		this.#camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0.1, 1000 );
		this.#camera.position.set( 0, 0, 500 );

		this.#renderer = new THREE.WebGLRenderer( {
			antialias: true,
			alpha: true,
			premultipliedAlpha: false,
		} );
		this.#renderer.setClearColor( 0x000000, 0 );
		this.#renderer.setPixelRatio(
			Math.min( window.devicePixelRatio || 1, 2 )
		);
		container.appendChild( this.#renderer.domElement );
		this.#renderer.domElement.style.display = 'block';

		this.#scene.add( new THREE.AmbientLight( 0xffffff, 0.9 ) );
		const key = new THREE.DirectionalLight( 0xffffff, 1.05 );
		key.position.set( 120, 180, 320 );
		this.#scene.add( key );
		const fill = new THREE.DirectionalLight( 0xdde4ff, 0.4 );
		fill.position.set( -160, -40, 120 );
		this.#scene.add( fill );

		this.#root = new THREE.Group();
		this.#scene.add( this.#root );

		this.#rebuildGeometry();

		this.#resizeObserver = new ResizeObserver( () => {
			this.#fitToText();
			this.#paint();
		} );
		const column =
			container.closest(
				'.is-root-container, .editor-styles-wrapper, .wp-block-post-content, .entry-content, article'
			) || document.body;
		this.#resizeObserver.observe( column );
	}

	/**
	 * @param {string} nextHtml
	 */
	update( nextHtml ) {
		this.#html = nextHtml;
		this.#rebuildGeometry();
	}

	/**
	 * @param {Object} nextSettings
	 * @param {string} [nextFontUrl]
	 * @return {Promise<void>}
	 */
	async setSettings( nextSettings, nextFontUrl ) {
		const previous = this.#settings;
		this.#settings = { ...DEFAULT_SETTINGS, ...nextSettings };

		const fontChanged =
			nextFontUrl && nextFontUrl !== this.#currentFontUrl;
		const rebuild =
			fontChanged || needsGeometryRebuild( previous, this.#settings );

		if ( fontChanged ) {
			this.#currentFontUrl = nextFontUrl;
			this.#font = await loadFont( this.#currentFontUrl );
		}

		if ( rebuild ) {
			this.#rebuildGeometry();
			return;
		}

		this.#applyPose();
		this.#applyAppearance();
		this.#fitToText();
		this.#paint();
	}

	dispose() {
		this.#disposed = true;
		this.#resizeObserver.disconnect();
		if ( this.#mesh ) {
			this.#root.remove( this.#mesh );
			this.#mesh.geometry.dispose();
			this.#mesh.material.dispose();
		}
		this.#renderer.dispose();
		if ( this.#renderer.domElement.parentNode === this.#container ) {
			this.#container.removeChild( this.#renderer.domElement );
		}
	}

	#paint() {
		if ( ! this.#disposed ) {
			this.#renderer.render( this.#scene, this.#camera );
		}
	}

	#applyPose() {
		this.#root.rotation.set(
			this.#settings.rotateX * DEG,
			this.#settings.rotateY * DEG,
			this.#settings.rotateZ * DEG
		);
		if ( this.#mesh ) {
			this.#mesh.position.set(
				this.#settings.offsetX,
				this.#settings.offsetY,
				0
			);
		}
	}

	#applyAppearance() {
		if ( ! this.#mesh ) {
			return;
		}
		const colour = this.#settings.textColor || this.#type.color;
		this.#mesh.material.color.set( colour );
		const finish = materialFinish( this.#settings.shiny );
		this.#mesh.material.metalness = finish.metalness;
		this.#mesh.material.roughness = finish.roughness;
		this.#mesh.material.needsUpdate = true;
	}

	/**
	 * Size the canvas from the posed bounds. Only shrink if wider than the content column.
	 */
	#fitToText() {
		if ( ! this.#mesh ) {
			return;
		}

		const baseScale = this.#mesh.userData.baseScale || 1;
		this.#mesh.scale.setScalar( baseScale );
		this.#root.updateWorldMatrix( true, true );
		const box = new THREE.Box3().setFromObject( this.#root );
		const size = box.getSize( new THREE.Vector3() );

		let w = Math.max( Math.ceil( size.x * FRAME_MARGIN ), 1 );
		let h = Math.max( Math.ceil( size.y * FRAME_MARGIN ), 1 );

		const maxW = getColumnMaxWidth( this.#container );
		if ( maxW > 0 && w > maxW ) {
			const s = maxW / w;
			w = maxW;
			h = Math.max( Math.ceil( h * s ), 1 );
			this.#mesh.scale.setScalar( baseScale * s );
		}

		this.#container.style.width = `${ w }px`;
		this.#container.style.height = `${ h }px`;
		this.#renderer.setSize( w, h, false );

		this.#camera.left = -w / 2;
		this.#camera.right = w / 2;
		this.#camera.top = h / 2;
		this.#camera.bottom = -h / 2;
		this.#camera.updateProjectionMatrix();
		this.#camera.lookAt( 0, 0, 0 );
	}

	#rebuildGeometry() {
		const text = toPlainText( this.#html ) || '3D Text';

		if ( this.#mesh ) {
			this.#root.remove( this.#mesh );
			this.#mesh.geometry.dispose();
			this.#mesh.material.dispose();
			this.#mesh = null;
		}

		const depth = Math.max( this.#type.fontSize * this.#settings.depth, 0.5 );
		const bevelEnabled = this.#settings.bevel > 0;
		const bevelSize = bevelEnabled
			? Math.max( this.#type.fontSize * this.#settings.bevel, 0.15 )
			: 0;

		const geometry = new TextGeometry( text, {
			font: this.#font,
			size: this.#type.fontSize,
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

		const finish = materialFinish( this.#settings.shiny );
		const material = new THREE.MeshStandardMaterial( {
			color: new THREE.Color(
				this.#settings.textColor || this.#type.color
			),
			metalness: finish.metalness,
			roughness: finish.roughness,
		} );

		this.#mesh = new THREE.Mesh( geometry, material );
		this.#mesh.userData.baseScale = 1;
		this.#root.add( this.#mesh );

		this.#applyPose();
		this.#fitToText();
		this.#paint();
	}
}

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
