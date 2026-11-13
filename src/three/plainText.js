/**
 * Strip HTML from RichText / saved markup down to plain characters for extrusion.
 *
 * @param {string} html
 * @return {string}
 */
export function toPlainText( html ) {
	if ( ! html ) {
		return '';
	}

	const doc = document.createElement( 'div' );
	doc.innerHTML = html;
	return ( doc.textContent || '' ).replace( /\s+/g, ' ' ).trim();
}
