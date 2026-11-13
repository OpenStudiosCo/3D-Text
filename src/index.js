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
				blocks: [ 'core/paragraph', 'core/heading' ],
				transform: ( { content } ) =>
					createBlock( metadata.name, { content } ),
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { content } ) =>
					createBlock( 'core/paragraph', { content } ),
			},
		],
	},
} );
