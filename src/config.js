/**
 * Runtime config injected by PHP (`window.os3dt`) before the block scripts run.
 *
 * @return {{ fontUrl: string }}
 */
export function getConfig() {
	const data = typeof window !== 'undefined' ? window.os3dt : null;
	return {
		fontUrl: data?.fontUrl || '',
	};
}
