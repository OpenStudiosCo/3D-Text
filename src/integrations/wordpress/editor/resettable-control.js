import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

const resetIcon = (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
		<path d="M12 5V2.2L8.5 5.7 12 9.2V6.5c2.8 0 5 2.2 5 5a5 5 0 0 1-7.6 4.3l-1.2 1.5A6.9 6.9 0 0 0 12 18.5c3.9 0 7-3.1 7-7 0-3.7-2.9-6.8-6.5-7.1V5zm-5.4 3.2A5 5 0 0 0 7 11.5c0 1.1.4 2.2 1 3l1.3-1.2A3.4 3.4 0 0 1 8.5 11.5c0-1.4.8-2.6 2-3.2L9.3 6.7A6.8 6.8 0 0 0 6.6 8.2z" />
	</svg>
);

/**
 * @param {*} value
 * @param {*} defaultValue
 * @return {boolean}
 */
function isAtDefault( value, defaultValue ) {
	if ( typeof defaultValue === 'number' && typeof value === 'number' ) {
		return Math.abs( value - defaultValue ) < 1e-6;
	}
	return value === defaultValue;
}

/**
 * Label row with a compact reset icon; children fill the full control width.
 *
 * @param {Object}      props
 * @param {string}      props.label
 * @param {string}      [props.help]
 * @param {*}           props.value
 * @param {*}           props.defaultValue
 * @param {Function}    props.onReset
 * @param {import('react').ReactNode} props.children
 * @return {JSX.Element}
 */
export default function ResettableControl( {
	label,
	help,
	value,
	defaultValue,
	onReset,
	children,
} ) {
	const atDefault = isAtDefault( value, defaultValue );

	return (
		<div className="os3dt-resettable-control">
			<div className="os3dt-resettable-control__label-row">
				<span className="os3dt-resettable-control__label">{ label }</span>
				<Button
					className="os3dt-resettable-control__reset"
					icon={ resetIcon }
					label={ __( 'Reset to default', 'openstudios-3d-text' ) }
					showTooltip
					size="small"
					disabled={ atDefault }
					onClick={ onReset }
				/>
			</div>
			{ children ? (
				<div className="os3dt-resettable-control__field">{ children }</div>
			) : null }
			{ help ? (
				<p className="os3dt-resettable-control__help">{ help }</p>
			) : null }
		</div>
	);
}
