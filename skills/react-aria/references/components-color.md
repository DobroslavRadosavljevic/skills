# Color components

Package: `react-aria-components` 1.22.1, with color utilities from `react-stately/Color`. Docs: `https://react-aria.adobe.com/<Page>` (add `.md` for Markdown).

Contents:

- [The Color object](#the-color-object): parseColor, getColorChannels, Color methods
- [Shared rules](#shared-rules)
- [ColorThumb](#colorthumb)
- [ColorArea](#colorarea)
- [ColorSlider](#colorslider)
- [ColorWheel](#colorwheel)
- [ColorField](#colorfield)
- [ColorSwatch](#colorswatch)
- [ColorSwatchPicker](#colorswatchpicker)
- [ColorPicker](#colorpicker): synced value and composition recipes
- [Color descriptions](#color-descriptions)

Which to pick:

| Need | Component |
| --- | --- |
| Adjust two channels on a 2D gradient | `ColorArea` |
| Adjust one channel | `ColorSlider` |
| Adjust hue on a ring | `ColorWheel` |
| Type a hex or channel value | `ColorField` |
| Show a color | `ColorSwatch` |
| Pick from presets | `ColorSwatchPicker` |
| Sync any of these to one value | `ColorPicker` |

## The Color object

`parseColor`, `getColorChannels`, and the types `Color`, `ColorSpace`, `ColorChannel`, `ColorFormat`, `ColorAxes`, `ColorChannelRange` are exported from `react-stately/Color` and from each `react-aria-components/Color*` subpath.

The docs "Color" entry under Related Types on these pages shows an icon component by mistake. The real `Color` is the interface below.

```ts
import {getColorChannels, parseColor, type Color, type ColorSpace} from 'react-stately/Color';

let color: Color = parseColor('hsl(50, 100%, 50%)');
let space: ColorSpace = 'hsb';
let channels = getColorChannels(space); // ['hue', 'saturation', 'brightness']
```

`parseColor(value: string): Color` throws on invalid input (`Invalid color value`). Wrap user-entered strings in a try/catch. Accepted formats:

- Hex: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`
- `rgb(r, g, b)`, `rgba(r, g, b, a)`
- `hsl(h, s%, l%)`, `hsla(h, s%, l%, a)`
- `hsb(h, s%, b%)`, `hsba(h, s%, b%, a)`

CSS named colors are not accepted.

Types:

- `ColorSpace`: `'rgb' | 'hsl' | 'hsb'`
- `ColorFormat`: `'hex' | 'hexa' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hsb' | 'hsba'`
- `ColorChannel`: `'hue' | 'saturation' | 'brightness' | 'lightness' | 'red' | 'green' | 'blue' | 'alpha'`
- `getColorChannels(space)`: the three channels for a space, without alpha.

`Color` methods. Instances are immutable: changes return a new object.

| Method | Use |
| --- | --- |
| `toFormat(format)` | Convert to a format, returns `Color` |
| `toString(format?)` | String. Argument is a `ColorFormat` or `'css'`, the default |
| `toHexInt()` | Number form |
| `clone()` | Copy |
| `getChannelValue(channel)` | Read a channel |
| `withChannelValue(channel, value)` | New color with the channel changed |
| `getChannelRange(channel)` | `{minValue, maxValue, step, pageSize}` |
| `getChannelName(channel, locale)` | Localized channel name |
| `getChannelFormatOptions(channel)` | `Intl.NumberFormatOptions` |
| `formatChannelValue(channel, locale)` | Localized channel value |
| `getColorSpace()` | Current space |
| `getColorSpaceAxes({xChannel?, yChannel?})` | `{xChannel, yChannel, zChannel}` |
| `getColorChannels()` | Three channels of the current space |
| `getColorName(locale)` | Localized description, for example "dark vibrant blue" |
| `getHueName(locale)` | Localized hue name |

```ts
import {parseColor} from 'react-stately/Color';

let brand = parseColor('#9B80FF');
brand.toString('hex');                               // '#9B80FF' (upper case)
brand.toFormat('hsl').getChannelValue('lightness');  // a number
brand.withChannelValue('alpha', 0.5).toString('rgba');
brand.getColorName('en-US');                         // a short description
```

## Shared rules

- `value` and `defaultValue` accept `string | Color`. `onChange` always passes a `Color`. Keep `Color` in state and convert at the edges with `toString`.
- `onChange` runs during a drag on `ColorArea`, `ColorSlider`, and `ColorWheel`. Run costly work in `onChangeEnd`.
- `colorSpace` chooses the space a component works in, and its channels must belong to that space. Without it, the space comes from the value.
- `ColorArea` and `SliderTrack` have no default size. Give them one in CSS. `ColorWheel` takes its size from its radius props.
- Backgrounds are generated from the current color and given as inline style. To add a layer such as a checkerboard for alpha, or to override it, use a `style` function and read `defaultStyle`:

```tsx
import {ColorSlider, SliderTrack} from 'react-aria-components/ColorSlider';

<ColorSlider channel="alpha" defaultValue="#f80">
  <SliderTrack
    style={({defaultStyle}) => ({
      background: `${defaultStyle.background},
        repeating-conic-gradient(#CCC 0% 25%, white 0% 50%) 50% / 16px 16px`
    })}
  />
</ColorSlider>
```

## ColorThumb

The draggable part of `ColorArea`, `ColorSlider`, and `ColorWheel`.

```tsx
import {ColorThumb} from 'react-aria-components/ColorThumb';

<ColorThumb
  style={({defaultStyle, isDisabled}) => ({
    ...defaultStyle,
    backgroundColor: isDisabled ? undefined : defaultStyle.backgroundColor,
    width: 18,
    height: 18,
    borderRadius: '50%',
    border: '2px solid white',
    boxShadow: '0 0 0 1px black, inset 0 0 0 1px black'
  })}
/>
```

Styling: class `react-aria-ColorThumb`. Data attributes: `data-dragging`, `data-hovered`, `data-focused`, `data-focus-visible`, `data-disabled`. Render props add `color: Color`.

- The inline `defaultStyle` holds position, transform, and the current `backgroundColor`. Spread it in any `style` function.
- Enlarge the thumb on `data-focus-visible` so the ring is easy to see. The starter grows it from 18px to 32px.
- In `ColorSlider`, center the thumb on the cross axis in CSS: `top: 50%` for horizontal, `left: 50%` for vertical.

## ColorArea

Two channels on a 2D gradient. Docs: https://react-aria.adobe.com/ColorArea

```tsx
import {useState} from 'react';
import {ColorArea, ColorThumb, parseColor} from 'react-aria-components/ColorArea';

function Example() {
  let [current, setCurrent] = useState(parseColor('#9B80FF'));
  let [final, setFinal] = useState(current);
  return (
    <ColorArea
      aria-label="Fill color"
      xChannel="red"
      yChannel="green"
      value={current}
      onChange={setCurrent}
      onChangeEnd={setFinal}
      style={{width: 224, height: 224}}>
      <ColorThumb />
    </ColorArea>
  );
}
```

Key props:

- Value: `value`, `defaultValue` (`string | Color`), `onChange(color)`, `onChangeEnd(color)`.
- Channels: `colorSpace: ColorSpace`, `xChannel: ColorChannel`, `yChannel: ColorChannel`.
- Forms: `xName`, `yName`, `form`. One input for each axis.
- `isDisabled`, `aria-label`, `aria-labelledby`.

Styling: class `react-aria-ColorArea`. Data attribute: `data-disabled`. Render props add `state: ColorAreaState`.

- The starter sets `width: 100%; max-width: 224px; aspect-ratio: 1/1`.
- The usual picker uses `colorSpace="hsb" xChannel="saturation" yChannel="brightness"`, paired with a hue slider.
- `[data-disabled]` needs `background: gray !important` to override the inline gradient.
- No `Label` part. If you set `aria-label`, it joins the built-in channel labels. Without one, the channels name themselves.

## ColorSlider

One channel. Docs: https://react-aria.adobe.com/ColorSlider

```tsx
import {Label} from 'react-aria-components/Label';
import {ColorSlider, ColorThumb, SliderOutput, SliderTrack} from 'react-aria-components/ColorSlider';

<ColorSlider channel="hue" defaultValue="hsl(50, 100%, 50%)">
  <Label>Hue</Label>
  <SliderOutput />
  <SliderTrack style={{height: 24, borderRadius: 8}}>
    <ColorThumb style={({defaultStyle}) => ({...defaultStyle, top: '50%'})} />
  </SliderTrack>
</ColorSlider>
```

The `ColorSlider` subpath does not export `Label`. Import it from `react-aria-components/Label`.

Key props:

- `channel: ColorChannel` (required).
- Value: `value`, `defaultValue`, `onChange`, `onChangeEnd`.
- `colorSpace`, `orientation` (default `'horizontal'`).
- Forms: `name`, `form`.
- `isDisabled`.

Styling:

- `react-aria-ColorSlider`: `data-orientation`, `data-disabled`. Render props add `state: ColorSliderState`.
- `react-aria-SliderTrack`: also `data-hovered`. `defaultStyle.background` is the gradient.
- `react-aria-SliderOutput`: renders the formatted channel value.

Label: without a `Label` or `aria-label`, the localized channel name is used. For a vertical slider, hide the visual label and output, and set `aria-label`.

## ColorWheel

Hue on a ring. Docs: https://react-aria.adobe.com/ColorWheel

```tsx
import {ColorThumb, ColorWheel, ColorWheelTrack} from 'react-aria-components/ColorWheel';

<ColorWheel outerRadius={100} innerRadius={74} defaultValue="hsl(50, 100%, 50%)">
  <ColorWheelTrack />
  <ColorThumb />
</ColorWheel>
```

Key props:

- `outerRadius: number`, `innerRadius: number`: required, in pixels. The wheel's size comes from these. They are not responsive.
- Value: `value`, `defaultValue` (default `'hsl(0, 100%, 50%)'`), `onChange`, `onChangeEnd`.
- Forms: `name`, `form`.
- `isDisabled`, `aria-label`. Without a label, a default one is supplied.

Styling:

- `react-aria-ColorWheel`: `data-disabled`. Render props add `state: ColorWheelState`.
- `react-aria-ColorWheelTrack`: `data-disabled`. To override the inline background when disabled, use `background: gray !important`.

## ColorField

Edit a hex value or one channel as text. Docs: https://react-aria.adobe.com/ColorField

```tsx
import {useState} from 'react';
import {ColorField, FieldError, Input, Label, parseColor, Text, type Color} from 'react-aria-components/ColorField';

function BrandColor() {
  let [value, setValue] = useState<Color | null>(parseColor('#e73623'));
  return (
    <ColorField name="brandColor" isRequired value={value} onChange={setValue}>
      <Label>Brand color</Label>
      <Input placeholder="Enter a color" />
      <Text slot="description">Used on buttons.</Text>
      <FieldError />
    </ColorField>
  );
}
```

Channel mode: set `colorSpace` and `channel`. The field behaves as a number field for that channel, with no stepper buttons in the anatomy.

```tsx
import {ColorField, Input, Label} from 'react-aria-components/ColorField';

<ColorField colorSpace="hsl" channel="hue" value={color} onChange={setColor}>
  <Label>Hue</Label>
  <Input />
</ColorField>
```

Key props:

- Value: `value`, `defaultValue` (`string | Color | null`), `onChange(color: Color | null)`. Note the `null`: the field can be empty.
- `channel`, `colorSpace`. Without `channel`, the field always shows an RGB hex value.
- `isWheelDisabled`: stop value changes by scroll.
- Validation and state: `isRequired`, `isInvalid`, `validate(value: Color | null)`, `validationBehavior`, `name`, `form`, `isDisabled`, `isReadOnly`.

Styling: class `react-aria-ColorField`. Data attributes: `data-channel="hex | hue | saturation | ..."`, `data-disabled`, `data-invalid`, `data-readonly`, `data-required`. Render props add `state: ColorFieldState`.

Without a label in channel mode, the localized channel name becomes the `aria-label`.

## ColorSwatch

Shows a color. Docs: https://react-aria.adobe.com/ColorSwatch

```tsx
import {ColorSwatch} from 'react-aria-components/ColorSwatch';

<ColorSwatch
  color="#f00"
  aria-label="Background color"
  colorName="Fire truck red"
  style={({color}) => ({
    width: 32,
    height: 32,
    borderRadius: 4,
    background: `linear-gradient(${color}, ${color}),
      repeating-conic-gradient(#CCC 0% 25%, white 0% 50%) 50% / 16px 16px`
  })}
/>
```

Key props: `color: string | Color`, `colorName: string` (overrides the generated name, for example Pantone names; provide it localized), `aria-label` (adds context; a screen reader reads "Fire truck red, Background color").

Styling: class `react-aria-ColorSwatch`. Render prop: `color: Color`. No state data attributes. Default inline style includes the color. It renders `role="img"` with the color description as its label.

Inside `ColorPicker`, omit `color`. It reads from context.

## ColorSwatchPicker

Selects one color from a list of swatches. Docs: https://react-aria.adobe.com/ColorSwatchPicker

```tsx
import {useState} from 'react';
import {ColorSwatch, ColorSwatchPicker, ColorSwatchPickerItem, parseColor} from 'react-aria-components/ColorSwatchPicker';

function Presets() {
  let [value, setValue] = useState(parseColor('#A00'));
  return (
    <ColorSwatchPicker aria-label="Presets" value={value} onChange={setValue}>
      <ColorSwatchPickerItem color="#A00"><ColorSwatch /></ColorSwatchPickerItem>
      <ColorSwatchPickerItem color="#f80"><ColorSwatch /></ColorSwatchPickerItem>
      <ColorSwatchPickerItem color="#080" isDisabled><ColorSwatch /></ColorSwatchPickerItem>
    </ColorSwatchPicker>
  );
}
```

Key props:

- `ColorSwatchPicker`: `value`, `defaultValue` (`string | Color`), `onChange(color)`, `layout: 'grid' | 'stack'` (default `'grid'`), `aria-label`.
- `ColorSwatchPickerItem`: `color: string | Color` (required), `isDisabled`, press and hover events.

Styling:

- `react-aria-ColorSwatchPicker`: `data-empty`, `data-focused`, `data-focus-visible`, `data-layout`, `data-orientation`.
- `react-aria-ColorSwatchPickerItem`: `data-selected`, `data-focus-visible`, `data-disabled`, plus the usual item states. Render props add `color: Color`.
- Selection ring from the starter: `[data-selected]::after { content: ''; position: absolute; inset: 0; border: 2px solid black; outline: 2px solid white; outline-offset: -4px; border-radius: inherit; }`.

Gotchas:

- It is a listbox. Arrow keys move between swatches.
- **Colors must be unique.** `#f00`, `hsl(0, 100%, 50%)`, and `hsb(0, 100%, 100%)` count as the same color. Duplicates break selection.
- The item does not render a swatch by itself. Add `<ColorSwatch />` as a child. It takes its color from the item.

## ColorPicker

Syncs one value across color components. It renders no DOM of its own, and has no class. Compose any layout. Docs: https://react-aria.adobe.com/ColorPicker

```tsx
import {useState} from 'react';
import {Button} from 'react-aria-components/Button';
import {ColorArea, ColorThumb} from 'react-aria-components/ColorArea';
import {ColorField, Input, Label} from 'react-aria-components/ColorField';
import {ColorPicker, parseColor} from 'react-aria-components/ColorPicker';
import {ColorSlider, SliderOutput, SliderTrack} from 'react-aria-components/ColorSlider';
import {ColorSwatch} from 'react-aria-components/ColorSwatch';
import {DialogTrigger, Popover} from 'react-aria-components/Popover';

function FillPicker() {
  let [value, setValue] = useState(parseColor('hsl(50, 100%, 50%)'));
  return (
    <ColorPicker value={value} onChange={setValue}>
      <DialogTrigger>
        <Button>
          <ColorSwatch />
          <span>Fill color</span>
        </Button>
        <Popover placement="bottom start">
          <ColorArea colorSpace="hsb" xChannel="saturation" yChannel="brightness" style={{width: 192, height: 192}}>
            <ColorThumb />
          </ColorArea>
          <ColorSlider colorSpace="hsb" channel="hue">
            <Label>Hue</Label>
            <SliderOutput />
            <SliderTrack>
              <ColorThumb />
            </SliderTrack>
          </ColorSlider>
          <ColorField>
            <Label>Hex</Label>
            <Input />
          </ColorField>
        </Popover>
      </DialogTrigger>
    </ColorPicker>
  );
}
```

Key props: `value`, `defaultValue` (`string | Color`), `onChange(color)`, `children` (node or render function with `{color}`).

Children inside `ColorPicker` read and set the shared value through context. Do not pass `value` or `color` to them.

Recipes from the docs:

- **Channel sliders**: map `getColorChannels(space)` to a `ColorSlider` per channel, plus `<ColorSlider channel="alpha" />`. Hold `space` in state and use a `Select` to switch among `rgb`, `hsl`, and `hsb`. Pass `colorSpace={space}` and `key={channel}`.
- **Channel fields**: the same, mapping to `<ColorField colorSpace={space} channel={channel} />`, under a `ColorArea` and hue slider.
- **Wheel and area**: `ColorWheel` with an absolutely positioned `ColorArea colorSpace="hsb" xChannel="saturation" yChannel="brightness"` centered inside the ring: `position: absolute; top: calc(50% - 50px); left: calc(50% - 50px); width: 100px; height: 100px`. Its containing element must be positioned.
- **Swatches**: `ColorArea`, hue `ColorSlider`, and a `ColorSwatchPicker` of presets. The picker writes to the shared value.

```tsx
import {useState} from 'react';
import {ColorPicker, getColorChannels, type ColorSpace} from 'react-aria-components/ColorPicker';
import {ColorSlider, ColorThumb, SliderTrack} from 'react-aria-components/ColorSlider';

function ChannelSliders() {
  let [space] = useState<ColorSpace>('rgb');
  return (
    <ColorPicker defaultValue="#184">
      {getColorChannels(space).map(channel => (
        <ColorSlider key={channel} colorSpace={space} channel={channel}>
          <SliderTrack><ColorThumb /></SliderTrack>
        </ColorSlider>
      ))}
    </ColorPicker>
  );
}
```

## Color descriptions

Screen readers get a generated, localized description, not only raw numbers. A hue slider announces, for example, "260 degrees, blue purple, slider". Descriptions combine lightness (very dark, dark, light, very light), chroma (grayish, pale, vibrant), and hue (for example, red orange or blue purple), computed in OKLCH. Word order follows the language.

- Use `color.getColorName(locale)` and `color.getHueName(locale)` for the same text in your UI, such as a caption next to a swatch.
- For brand or print names, set `colorName` on `ColorSwatch`. Provide it in the user's language.
- Do not add your own live region for the color. The components already announce changes.
