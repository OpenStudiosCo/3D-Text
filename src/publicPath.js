/**
 * Point webpack async chunks at this plugin's build/ directory.
 * window.os3dt is inlined by PHP before the editor script runs.
 */
if ( typeof window !== 'undefined' && window.os3dt?.publicPath ) {
	// eslint-disable-next-line camelcase, no-undef
	__webpack_public_path__ = window.os3dt.publicPath;
}
