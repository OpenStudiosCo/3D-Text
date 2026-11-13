/**
 * Runtime config injected by PHP (`window.os3dt`) before the block scripts run.
 *
 * @return {{ fonts: Object, publicPath: string }}
 */
export function getConfig() {
	const data = typeof window !== 'undefined' ? window.os3dt : null;
	return {
		fonts: data?.fonts || {},
		publicPath: data?.publicPath || '',
	};
}

/**
 * Resolve a typeface JSON URL for the given family and weight.
 *
 * @param {string} family
 * @param {string} weight
 * @return {string}
 */
export function resolveFontUrl( family = 'helvetiker', weight = 'regular' ) {
	const { fonts } = getConfig();
	const familyFonts = fonts[ family ] || fonts.helvetiker || {};
	return (
		familyFonts[ weight ] ||
		familyFonts.regular ||
		fonts.helvetiker?.regular ||
		''
	);
}
