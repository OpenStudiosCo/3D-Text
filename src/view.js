import './public-path';
import { mountBlocks } from './integrations/wordpress/view/mount';

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', mountBlocks );
} else {
	mountBlocks();
}
