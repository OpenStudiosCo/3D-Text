import { useBlockProps, RichText } from '@wordpress/block-editor';
import { toPlainText } from '../../../type/plain-text';
import { contentTag } from '../../../type/content-tag';
import {
	settingsFromAttributes,
	settingsToDataset,
	DEFAULT_SETTINGS,
} from '../../../type/settings';

/**
 * v0.2 saved markup: text + level only (no settings dataset).
 */
const deprecatedV02 = {
	attributes: {
		content: {
			type: 'string',
			source: 'html',
			selector: '.wp-block-openstudios-three-d-text__content',
			default: '',
		},
		level: {
			type: 'number',
			default: 0,
		},
	},
	save( { attributes } ) {
		const { content, level } = attributes;
		const Tag = contentTag( level );
		const plain = toPlainText( content );
		const blockProps = useBlockProps.save( {
			className: 'wp-block-openstudios-three-d-text',
			'data-os3dt-text': plain,
			'data-os3dt-level': String( level || 0 ),
		} );
		return (
			<div { ...blockProps }>
				<Tag className="wp-block-openstudios-three-d-text__content">
					<RichText.Content value={ content } />
				</Tag>
				<div
					className="wp-block-openstudios-three-d-text__canvas"
					aria-hidden="true"
				/>
			</div>
		);
	},
	migrate( attributes ) {
		return {
			...DEFAULT_SETTINGS,
			...attributes,
			cacheHash: '',
			cacheWidth: 0,
			cacheHeight: 0,
			presetId: '',
		};
	},
};

/**
 * Early 0.3 without sizeScale on the wrapper.
 */
const deprecatedEarly03 = {
	attributes: {
		content: {
			type: 'string',
			source: 'html',
			selector: '.wp-block-openstudios-three-d-text__content',
			default: '',
		},
		level: { type: 'number', default: 0 },
		rotateX: { type: 'number', default: DEFAULT_SETTINGS.rotateX },
		rotateY: { type: 'number', default: DEFAULT_SETTINGS.rotateY },
		rotateZ: { type: 'number', default: DEFAULT_SETTINGS.rotateZ },
		offsetX: { type: 'number', default: DEFAULT_SETTINGS.offsetX },
		offsetY: { type: 'number', default: DEFAULT_SETTINGS.offsetY },
		depth: { type: 'number', default: DEFAULT_SETTINGS.depth },
		bevel: { type: 'number', default: DEFAULT_SETTINGS.bevel },
		fontFamily: {
			type: 'string',
			default: DEFAULT_SETTINGS.fontFamily,
		},
		fontWeight: {
			type: 'string',
			default: DEFAULT_SETTINGS.fontWeight,
		},
		textColor: { type: 'string', default: '' },
		shiny: { type: 'boolean', default: false },
	},
	save( { attributes } ) {
		const { content, level } = attributes;
		const Tag = contentTag( level );
		const plain = toPlainText( content );
		const settings = settingsFromAttributes( {
			...attributes,
			sizeScale: DEFAULT_SETTINGS.sizeScale,
		} );
		const {
			'data-os3dt-size-scale': _ignored,
			...legacyDataset
		} = settingsToDataset( settings );
		const blockProps = useBlockProps.save( {
			className: 'wp-block-openstudios-three-d-text',
			'data-os3dt-text': plain,
			'data-os3dt-level': String( level || 0 ),
			...legacyDataset,
		} );
		return (
			<div { ...blockProps }>
				<Tag className="wp-block-openstudios-three-d-text__content">
					<RichText.Content value={ content } />
				</Tag>
				<div
					className="wp-block-openstudios-three-d-text__canvas"
					aria-hidden="true"
				/>
			</div>
		);
	},
	migrate( attributes ) {
		return {
			sizeScale: DEFAULT_SETTINGS.sizeScale,
			cacheHash: '',
			cacheWidth: 0,
			cacheHeight: 0,
			presetId: '',
			...attributes,
		};
	},
};

export default [ deprecatedEarly03, deprecatedV02 ];
