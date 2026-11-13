import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	PanelColorSettings,
} from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { DEFAULT_SETTINGS } from '../../../type/settings';
import ResettableControl from './resettable-control';

const DEFAULT_LEVEL = 0;

/**
 * Block sidebar controls for pose, typeface, extrusion and appearance.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 * @return {JSX.Element}
 */
export default function Inspector( { attributes, setAttributes } ) {
	const {
		level,
		rotateX,
		rotateY,
		rotateZ,
		offsetX,
		offsetY,
		sizeScale,
		depth,
		bevel,
		fontFamily,
		fontWeight,
		textColor,
		shiny,
	} = attributes;

	return (
		<InspectorControls>
			<PanelBody
				title={ __( 'Content', 'openstudios-3d-text' ) }
				initialOpen={ true }
			>
				<ResettableControl
					label={ __( 'HTML element', 'openstudios-3d-text' ) }
					help={ __(
						'Semantic tag used for the editable text and inherited type size.',
						'openstudios-3d-text'
					) }
					value={ Number( level ?? DEFAULT_LEVEL ) }
					defaultValue={ DEFAULT_LEVEL }
					onReset={ () => setAttributes( { level: DEFAULT_LEVEL } ) }
				>
					<SelectControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'HTML element', 'openstudios-3d-text' ) }
						hideLabelFromVision
						value={ String( level ?? 0 ) }
						options={ [
							{
								label: __( 'Paragraph', 'openstudios-3d-text' ),
								value: '0',
							},
							{
								label: __( 'Heading 1', 'openstudios-3d-text' ),
								value: '1',
							},
							{
								label: __( 'Heading 2', 'openstudios-3d-text' ),
								value: '2',
							},
							{
								label: __( 'Heading 3', 'openstudios-3d-text' ),
								value: '3',
							},
							{
								label: __( 'Heading 4', 'openstudios-3d-text' ),
								value: '4',
							},
							{
								label: __( 'Heading 5', 'openstudios-3d-text' ),
								value: '5',
							},
							{
								label: __( 'Heading 6', 'openstudios-3d-text' ),
								value: '6',
							},
						] }
						onChange={ ( value ) =>
							setAttributes( { level: Number( value ) } )
						}
					/>
				</ResettableControl>
			</PanelBody>

			<PanelBody
				title={ __( 'Transform', 'openstudios-3d-text' ) }
				initialOpen={ true }
			>
				<ResettableControl
					label={ __( 'Size', 'openstudios-3d-text' ) }
					help={ __(
						'Scale relative to the inherited font size of the HTML element.',
						'openstudios-3d-text'
					) }
					value={ sizeScale }
					defaultValue={ DEFAULT_SETTINGS.sizeScale }
					onReset={ () =>
						setAttributes( {
							sizeScale: DEFAULT_SETTINGS.sizeScale,
						} )
					}
				>
					<RangeControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Size', 'openstudios-3d-text' ) }
						hideLabelFromVision
						value={ sizeScale }
						onChange={ ( value ) =>
							setAttributes( { sizeScale: value ?? 1 } )
						}
						min={ 0.5 }
						max={ 3 }
						step={ 0.05 }
					/>
				</ResettableControl>
				<ResettableControl
					label={ __( 'Rotate X', 'openstudios-3d-text' ) }
					value={ rotateX }
					defaultValue={ DEFAULT_SETTINGS.rotateX }
					onReset={ () =>
						setAttributes( {
							rotateX: DEFAULT_SETTINGS.rotateX,
						} )
					}
				>
					<RangeControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Rotate X', 'openstudios-3d-text' ) }
						hideLabelFromVision
						value={ rotateX }
						onChange={ ( value ) =>
							setAttributes( { rotateX: value ?? 0 } )
						}
						min={ -180 }
						max={ 180 }
					/>
				</ResettableControl>
				<ResettableControl
					label={ __( 'Rotate Y', 'openstudios-3d-text' ) }
					value={ rotateY }
					defaultValue={ DEFAULT_SETTINGS.rotateY }
					onReset={ () =>
						setAttributes( {
							rotateY: DEFAULT_SETTINGS.rotateY,
						} )
					}
				>
					<RangeControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Rotate Y', 'openstudios-3d-text' ) }
						hideLabelFromVision
						value={ rotateY }
						onChange={ ( value ) =>
							setAttributes( { rotateY: value ?? 0 } )
						}
						min={ -180 }
						max={ 180 }
					/>
				</ResettableControl>
				<ResettableControl
					label={ __( 'Rotate Z', 'openstudios-3d-text' ) }
					value={ rotateZ }
					defaultValue={ DEFAULT_SETTINGS.rotateZ }
					onReset={ () =>
						setAttributes( {
							rotateZ: DEFAULT_SETTINGS.rotateZ,
						} )
					}
				>
					<RangeControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Rotate Z', 'openstudios-3d-text' ) }
						hideLabelFromVision
						value={ rotateZ }
						onChange={ ( value ) =>
							setAttributes( { rotateZ: value ?? 0 } )
						}
						min={ -180 }
						max={ 180 }
					/>
				</ResettableControl>
				<ResettableControl
					label={ __( 'Offset X', 'openstudios-3d-text' ) }
					value={ offsetX }
					defaultValue={ DEFAULT_SETTINGS.offsetX }
					onReset={ () =>
						setAttributes( {
							offsetX: DEFAULT_SETTINGS.offsetX,
						} )
					}
				>
					<RangeControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Offset X', 'openstudios-3d-text' ) }
						hideLabelFromVision
						value={ offsetX }
						onChange={ ( value ) =>
							setAttributes( { offsetX: value ?? 0 } )
						}
						min={ -100 }
						max={ 100 }
					/>
				</ResettableControl>
				<ResettableControl
					label={ __( 'Offset Y', 'openstudios-3d-text' ) }
					value={ offsetY }
					defaultValue={ DEFAULT_SETTINGS.offsetY }
					onReset={ () =>
						setAttributes( {
							offsetY: DEFAULT_SETTINGS.offsetY,
						} )
					}
				>
					<RangeControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Offset Y', 'openstudios-3d-text' ) }
						hideLabelFromVision
						value={ offsetY }
						onChange={ ( value ) =>
							setAttributes( { offsetY: value ?? 0 } )
						}
						min={ -100 }
						max={ 100 }
					/>
				</ResettableControl>
			</PanelBody>

			<PanelBody
				title={ __( 'Typeface', 'openstudios-3d-text' ) }
				initialOpen={ false }
			>
				<ResettableControl
					label={ __( 'Font family', 'openstudios-3d-text' ) }
					value={ fontFamily }
					defaultValue={ DEFAULT_SETTINGS.fontFamily }
					onReset={ () =>
						setAttributes( {
							fontFamily: DEFAULT_SETTINGS.fontFamily,
						} )
					}
				>
					<SelectControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Font family', 'openstudios-3d-text' ) }
						hideLabelFromVision
						value={ fontFamily }
						options={ [
							{
								label: __( 'Helvetiker', 'openstudios-3d-text' ),
								value: 'helvetiker',
							},
							{
								label: __( 'Optimer', 'openstudios-3d-text' ),
								value: 'optimer',
							},
							{
								label: __( 'Gentilis', 'openstudios-3d-text' ),
								value: 'gentilis',
							},
						] }
						onChange={ ( value ) =>
							setAttributes( { fontFamily: value } )
						}
					/>
				</ResettableControl>
				<ResettableControl
					label={ __( 'Font weight', 'openstudios-3d-text' ) }
					value={ fontWeight }
					defaultValue={ DEFAULT_SETTINGS.fontWeight }
					onReset={ () =>
						setAttributes( {
							fontWeight: DEFAULT_SETTINGS.fontWeight,
						} )
					}
				>
					<SelectControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Font weight', 'openstudios-3d-text' ) }
						hideLabelFromVision
						value={ fontWeight }
						options={ [
							{
								label: __( 'Regular', 'openstudios-3d-text' ),
								value: 'regular',
							},
							{
								label: __( 'Bold', 'openstudios-3d-text' ),
								value: 'bold',
							},
						] }
						onChange={ ( value ) =>
							setAttributes( { fontWeight: value } )
						}
					/>
				</ResettableControl>
			</PanelBody>

			<PanelBody
				title={ __( 'Extrusion', 'openstudios-3d-text' ) }
				initialOpen={ false }
			>
				<ResettableControl
					label={ __( 'Depth', 'openstudios-3d-text' ) }
					help={ __(
						'Extrusion depth relative to the font size.',
						'openstudios-3d-text'
					) }
					value={ depth }
					defaultValue={ DEFAULT_SETTINGS.depth }
					onReset={ () =>
						setAttributes( { depth: DEFAULT_SETTINGS.depth } )
					}
				>
					<RangeControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Depth', 'openstudios-3d-text' ) }
						hideLabelFromVision
						value={ depth }
						onChange={ ( value ) =>
							setAttributes( { depth: value ?? 0.08 } )
						}
						min={ 0.01 }
						max={ 0.4 }
						step={ 0.01 }
					/>
				</ResettableControl>
				<ResettableControl
					label={ __( 'Bevel', 'openstudios-3d-text' ) }
					help={ __(
						'Zero disables bevel for a thinner look.',
						'openstudios-3d-text'
					) }
					value={ bevel }
					defaultValue={ DEFAULT_SETTINGS.bevel }
					onReset={ () =>
						setAttributes( { bevel: DEFAULT_SETTINGS.bevel } )
					}
				>
					<RangeControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Bevel', 'openstudios-3d-text' ) }
						hideLabelFromVision
						value={ bevel }
						onChange={ ( value ) =>
							setAttributes( { bevel: value ?? 0 } )
						}
						min={ 0 }
						max={ 0.1 }
						step={ 0.005 }
					/>
				</ResettableControl>
			</PanelBody>

			<PanelColorSettings
				title={ __( 'Appearance', 'openstudios-3d-text' ) }
				initialOpen={ false }
				colorSettings={ [
					{
						value: textColor || undefined,
						onChange: ( value ) =>
							setAttributes( { textColor: value || '' } ),
						label: __( 'Text colour', 'openstudios-3d-text' ),
					},
				] }
			>
				<ResettableControl
					label={ __( 'Colour override', 'openstudios-3d-text' ) }
					help={
						textColor
							? __(
									'Custom colour is set. Reset restores inherited text colour.',
									'openstudios-3d-text'
							  )
							: __(
									'Using inherited text colour.',
									'openstudios-3d-text'
							  )
					}
					value={ textColor || '' }
					defaultValue={ DEFAULT_SETTINGS.textColor }
					onReset={ () =>
						setAttributes( {
							textColor: DEFAULT_SETTINGS.textColor,
						} )
					}
				/>
				<ResettableControl
					label={ __( 'Shiny material', 'openstudios-3d-text' ) }
					value={ !! shiny }
					defaultValue={ DEFAULT_SETTINGS.shiny }
					onReset={ () =>
						setAttributes( { shiny: DEFAULT_SETTINGS.shiny } )
					}
				>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Shiny material', 'openstudios-3d-text' ) }
						hideLabelFromVision
						checked={ !! shiny }
						onChange={ ( value ) =>
							setAttributes( { shiny: !! value } )
						}
						help={
							shiny
								? __(
										'Metal-like reflections on the extruded faces.',
										'openstudios-3d-text'
								  )
								: __(
										'Matte finish closer to flat type.',
										'openstudios-3d-text'
								  )
						}
					/>
				</ResettableControl>
			</PanelColorSettings>
		</InspectorControls>
	);
}
