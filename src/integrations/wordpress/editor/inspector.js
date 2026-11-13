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
				<SelectControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'HTML element', 'openstudios-3d-text' ) }
					help={ __(
						'Semantic tag used for the editable text and inherited type size.',
						'openstudios-3d-text'
					) }
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
			</PanelBody>

			<PanelBody
				title={ __( 'Transform', 'openstudios-3d-text' ) }
				initialOpen={ true }
			>
				<RangeControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Size', 'openstudios-3d-text' ) }
					help={ __(
						'Scale relative to the inherited font size of the HTML element.',
						'openstudios-3d-text'
					) }
					value={ sizeScale }
					onChange={ ( value ) =>
						setAttributes( { sizeScale: value ?? 1 } )
					}
					min={ 0.5 }
					max={ 3 }
					step={ 0.05 }
				/>
				<RangeControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Rotate X', 'openstudios-3d-text' ) }
					value={ rotateX }
					onChange={ ( value ) =>
						setAttributes( { rotateX: value ?? 0 } )
					}
					min={ -180 }
					max={ 180 }
				/>
				<RangeControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Rotate Y', 'openstudios-3d-text' ) }
					value={ rotateY }
					onChange={ ( value ) =>
						setAttributes( { rotateY: value ?? 0 } )
					}
					min={ -180 }
					max={ 180 }
				/>
				<RangeControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Rotate Z', 'openstudios-3d-text' ) }
					value={ rotateZ }
					onChange={ ( value ) =>
						setAttributes( { rotateZ: value ?? 0 } )
					}
					min={ -180 }
					max={ 180 }
				/>
				<RangeControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Offset X', 'openstudios-3d-text' ) }
					value={ offsetX }
					onChange={ ( value ) =>
						setAttributes( { offsetX: value ?? 0 } )
					}
					min={ -100 }
					max={ 100 }
				/>
				<RangeControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Offset Y', 'openstudios-3d-text' ) }
					value={ offsetY }
					onChange={ ( value ) =>
						setAttributes( { offsetY: value ?? 0 } )
					}
					min={ -100 }
					max={ 100 }
				/>
			</PanelBody>

			<PanelBody
				title={ __( 'Typeface', 'openstudios-3d-text' ) }
				initialOpen={ false }
			>
				<SelectControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Font family', 'openstudios-3d-text' ) }
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
				<SelectControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Font weight', 'openstudios-3d-text' ) }
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
			</PanelBody>

			<PanelBody
				title={ __( 'Extrusion', 'openstudios-3d-text' ) }
				initialOpen={ false }
			>
				<RangeControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Depth', 'openstudios-3d-text' ) }
					help={ __(
						'Extrusion depth relative to the font size.',
						'openstudios-3d-text'
					) }
					value={ depth }
					onChange={ ( value ) =>
						setAttributes( { depth: value ?? 0.08 } )
					}
					min={ 0.01 }
					max={ 0.4 }
					step={ 0.01 }
				/>
				<RangeControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Bevel', 'openstudios-3d-text' ) }
					help={ __(
						'Zero disables bevel for a thinner look.',
						'openstudios-3d-text'
					) }
					value={ bevel }
					onChange={ ( value ) =>
						setAttributes( { bevel: value ?? 0 } )
					}
					min={ 0 }
					max={ 0.1 }
					step={ 0.005 }
				/>
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
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Shiny material', 'openstudios-3d-text' ) }
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
			</PanelColorSettings>
		</InspectorControls>
	);
}
