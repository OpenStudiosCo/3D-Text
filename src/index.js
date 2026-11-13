import './public-path';
import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import Edit from './integrations/wordpress/editor/edit';
import save from './integrations/wordpress/save/save';
import icon from './integrations/wordpress/block/icon';
import transforms from './integrations/wordpress/block/transforms';
import deprecated from './integrations/wordpress/block/deprecated';
import './integrations/wordpress/style.scss';

registerBlockType( metadata.name, {
	icon,
	edit: Edit,
	save,
	transforms,
	deprecated,
} );
