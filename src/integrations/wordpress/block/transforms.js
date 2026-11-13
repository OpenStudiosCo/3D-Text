import { createBlock } from '@wordpress/blocks';
import metadata from '../../../block.json';

/**
 * Bidirectional transforms with core/paragraph and core/heading.
 *
 * @type {Object}
 */
const transforms = {
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
};

export default transforms;
