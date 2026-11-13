import { __ } from '@wordpress/i18n';
import { ToolbarDropdownMenu } from '@wordpress/components';

/**
 * @param {number} n
 * @return {JSX.Element}
 */
function headingIcon( n ) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<path d="M6.2 5.2h2.2v5.3h7.2V5.2h2.2v13.6h-2.2v-6.2H8.4v6.2H6.2V5.2z" />
			<text
				x="18"
				y="19"
				fontSize="8"
				fontFamily="sans-serif"
				fontWeight="700"
			>
				{ n }
			</text>
		</svg>
	);
}

const paragraphIcon = (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<path d="M9.3 6.2h7.2v1.9h-2.4v9.7h-2.1V8.1H9.3c-1.5 0-2.5.9-2.5 2.2S7.8 12.5 9.3 12.5h.6v2c-2.6-.1-4.4-1.7-4.4-4.1 0-2.5 1.9-4.2 4.4-4.2z" />
	</svg>
);

const TAG_OPTIONS = [
	{
		label: __( 'Paragraph', 'openstudios-3d-text' ),
		value: 0,
		icon: paragraphIcon,
	},
	{
		label: __( 'Heading 1', 'openstudios-3d-text' ),
		value: 1,
		icon: headingIcon( 1 ),
	},
	{
		label: __( 'Heading 2', 'openstudios-3d-text' ),
		value: 2,
		icon: headingIcon( 2 ),
	},
	{
		label: __( 'Heading 3', 'openstudios-3d-text' ),
		value: 3,
		icon: headingIcon( 3 ),
	},
	{
		label: __( 'Heading 4', 'openstudios-3d-text' ),
		value: 4,
		icon: headingIcon( 4 ),
	},
	{
		label: __( 'Heading 5', 'openstudios-3d-text' ),
		value: 5,
		icon: headingIcon( 5 ),
	},
	{
		label: __( 'Heading 6', 'openstudios-3d-text' ),
		value: 6,
		icon: headingIcon( 6 ),
	},
];

/**
 * Toolbar control to switch the inner content tag (paragraph or heading level).
 *
 * @param {Object}   props
 * @param {number}   props.level
 * @param {Function} props.onChange
 * @return {JSX.Element}
 */
export default function TagToolbar( { level, onChange } ) {
	const current =
		TAG_OPTIONS.find( ( option ) => option.value === Number( level ) ) ||
		TAG_OPTIONS[ 0 ];

	return (
		<ToolbarDropdownMenu
			icon={ current.icon }
			label={ __( 'Change content element', 'openstudios-3d-text' ) }
			controls={ TAG_OPTIONS.map( ( option ) => ( {
				title: option.label,
				icon: option.icon,
				isActive: option.value === Number( level ),
				onClick: () => onChange( option.value ),
			} ) ) }
		/>
	);
}
