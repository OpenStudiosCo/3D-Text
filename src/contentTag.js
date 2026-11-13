/**
 * Map stored heading level to a content tag. 0 (or anything else) is a paragraph.
 *
 * @param {number} level
 * @return {string}
 */
export function contentTag( level ) {
	const n = Number( level );
	if ( n >= 1 && n <= 6 ) {
		return `h${ n }`;
	}
	return 'p';
}
