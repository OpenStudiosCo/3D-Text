import './publicPath';
import { registerBlockType, createBlock } from '@wordpress/blocks';
import metadata from './block.json';
import Edit from './edit';
import save from './save';
import icon from './icon';
import './style.scss';

registerBlockType( metadata.name, {
	icon,
	edit: Edit,
	save,
	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { content } ) =>
					createBlock( metadata.name, { content, level: 0 } ),
			},
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: ( { content, level } ) =>
					createBlock( metadata.name, {
						content,
						level: level || 2,
					} ),
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				isMatch: ( { level } ) => ! level,
				transform: ( { content } ) =>
					createBlock( 'core/paragraph', { content } ),
			},
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				isMatch: ( { level } ) => level >= 1 && level <= 6,
				transform: ( { content, level } ) =>
					createBlock( 'core/heading', { content, level } ),
			},
		],
	},
} );
