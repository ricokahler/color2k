# [🌈 color2k](https://color2k.com)

[![bundlephobia](https://badgen.net/bundlephobia/minzip/color2k)](https://bundlephobia.com/result?p=color2k) [![github status checks](https://badgen.net/github/checks/ricokahler/color2k)](https://github.com/ricokahler/color2k/actions) [![codecov](https://codecov.io/gh/ricokahler/color2k/branch/master/graph/badge.svg)](https://codecov.io/gh/ricokahler/color2k) ![weekly downloads](https://badgen.net/npm/dw/color2k) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

> a color parsing and manipulation lib served in roughly 2kB or less (2.8kB to be more precise)

color2k is a color parsing and manipulation library with the objective of keeping the bundle size as small as possible while still satisfying all of your color manipulation needs in an sRGB space.

The full bundle size is [currently 2.8kB](https://bundlephobia.com/result?p=color2k) but [gets as small as 2.1k](https://bundlejs.com/?q=color2k&treeshake=[{darken}]) with tree shaking.

## Table of contents

- [Size comparison](#size-comparison)
- [Installation](#installation)
- [Usage](#usage)
- [How so small?](#how-so-small)
- [Trust and publishing](#trust-and-publishing)
- [Credits](#credits)
- [API](#api)

## Size comparison

| lib                                                       | size                                                  |
| --------------------------------------------------------- | ----------------------------------------------------- |
| [chroma-js](https://github.com/gka/chroma.js)             | [13.7kB](https://bundlephobia.com/result?p=chroma-js) |
| [polished](https://github.com/styled-components/polished) | [11.2kB](https://bundlephobia.com/result?p=polished)  |
| [color](https://github.com/Qix-/color)                    | [7.6kB](https://bundlephobia.com/result?p=color)      |
| [tinycolor2](https://github.com/bgrins/TinyColor)         | [5kB](https://bundlephobia.com/result?p=tinycolor2)   |
| color2k                                                   | [2.8kB](https://bundlephobia.com/result?p=color2k) 😎 |

👋 Compare tree-shaken bundle outputs on [bundlejs.com](https://bundlejs.com/?share=PTAEFcDsGMHsFt4FNIBdQENIBNRIB4AOsATuvLNuADZIDOoqsoc8hGJSjAFkgJYlQdPgC96oAFASQeIqXQAqUADMSCUACJo3NfAwBaAFZ0NAbmlgCxMqCWr1G4tT51e2MxdnXFK3ZrjUpB4yVvK2vg6ofJAAngGkAEweoTYA3tgcANYoAL4R8P6wgSQJmR5AA)

## Installation

Install with a package manager such as `npm`

```
npm i color2k
```

**OR** use with [skypack.dev](https://www.skypack.dev/) in supported environments (e.g. [deno](https://deno.land/manual/linking_to_external_code), [modern browsers](https://docs.skypack.dev/#whats-old-is-new-again)).

```js
import { darken, transparentize } from 'https://cdn.skypack.dev/color2k?min';
```

## Usage

```js
import { darken, transparentize } from 'color2k';

// e.g.
darken('blue', 0.1);
transparentize('red', 0.5);
```

## How so small?

There are two secrets that keep this lib especially small:

1. Simplicity — only handles basic color manipulation functions
2. Less branching in code — only support two color models as outputs, namely `rgba` and `hsla`

### Why only `rgba` and `hsla` as outputs?

This lib was created with the use case of CSS-in-JS in mind. At the end of the day, all that matters is that the browser can understand the color string you gave it as a `background-color`.

Because only those two color models are supported, we don't have to add code to deal with optional alpha channels or converting to non-browser supported color models (e.g. CMYK).

We believe that this lib is sufficient for all of your color manipulation needs. If we're missing a feature, feel free to [open an issue](https://github.com/ricokahler/color2k/issues/new) 😎.

## Trust and publishing

color2k is intentionally small and boring:

- Zero runtime dependencies.
- A narrow published package surface, limited to `dist`, `README.md`, `LICENSE`, and `package.json`.
- npm provenance is configured through trusted publishing for release builds.
- The README and docs site are generated from the JSDoc comments in `src/*.ts`.
- Security issues can be reported through the process in [SECURITY.md](https://github.com/ricokahler/color2k/blob/main/SECURITY.md).

Before publishing, maintainers should run the checks in [docs/release-checklist.md](https://github.com/ricokahler/color2k/blob/main/docs/release-checklist.md).

## Credits

Heavy credit goes to polished.js and Sass. Much of the implementation of this lib is copied from polished.

<!-- API-DOCS-START -->
## API

This section is generated from the JSDoc comments in `src/*.ts`.

### adjustHue(color, degrees)

```ts
function adjustHue(color: string, degrees: number): string
```

Rotates a color's hue by the given number of degrees and returns the result
as an `hsla` string. Hue values wrap around the 0 to 360 degree color wheel.

```js
adjustHue('red', 180); // 'hsla(180, 100%, 50%, 1)'
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `color` | `string` | The input color. |
| `degrees` | `number` | The number of degrees to rotate the hue. |

#### Returns

`string` - The adjusted color as an `hsla` string.

[Source](https://github.com/ricokahler/color2k/blob/main/src/adjustHue.ts)

### ColorError

```ts
class ColorError extends Error
```

Error thrown when color2k cannot parse an input color.

```js
new ColorError('nope').message; // 'Failed to parse color: "nope"'
```

#### Constructor Parameters

| Name | Type | Description |
| --- | --- | --- |
| `color` | `string` | The color value that failed to parse. |

[Source](https://github.com/ricokahler/color2k/blob/main/src/ColorError.ts)

### darken(color, amount)

```ts
function darken(color: string, amount: number): string
```

Darkens a color by subtracting from the lightness channel in HSL space.

```js
darken('white', 0.1); // 'hsla(0, 0%, 90%, 1)'
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `color` | `string` | The input color. |
| `amount` | `number` | The amount to darken, given as a decimal between 0 and 1. |

#### Returns

`string` - The darkened color as an `hsla` string.

[Source](https://github.com/ricokahler/color2k/blob/main/src/darken.ts)

### desaturate(color, amount)

```ts
function desaturate(color: string, amount: number): string
```

Desaturates a color by subtracting from the saturation channel in HSL space.

```js
desaturate('red', 0.5); // 'hsla(0, 50%, 50%, 1)'
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `color` | `string` | The input color. |
| `amount` | `number` | The amount to desaturate, given as a decimal between 0 and 1. |

#### Returns

`string` - The desaturated color as an `hsla` string.

[Source](https://github.com/ricokahler/color2k/blob/main/src/desaturate.ts)

### getContrast(color1, color2)

```ts
function getContrast(color1: string, color2: string): number
```

Returns the contrast ratio between two colors based on the WCAG contrast
ratio formula.

```js
getContrast('#444', '#fff'); // 9.739769120526205
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `color1` | `string` | The first color. |
| `color2` | `string` | The second color. |

#### Returns

`number` - The contrast ratio between the two colors.

[Source](https://github.com/ricokahler/color2k/blob/main/src/getContrast.ts)

### getLuminance(color)

```ts
function getLuminance(color: string): number
```

Returns the relative luminance of a color using the WCAG formula.

```js
getLuminance('papayawhip'); // 0.877971001998354
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `color` | `string` | The input color. |

#### Returns

`number` - A number between 0 for darkest black and 1 for lightest white.

[Source](https://github.com/ricokahler/color2k/blob/main/src/getLuminance.ts)

### getScale(colors)

```ts
function getScale(colors: string[]): (n: number) => string
```

Returns a scale function that interpolates through a list of colors.

The returned function accepts a decimal between 0 and 1 and returns the color
at that percentage in the scale.

```js
const scale = getScale('red', 'yellow', 'green');
console.log(scale(0)); // rgba(255, 0, 0, 1)
console.log(scale(0.5)); // rgba(255, 255, 0, 1)
console.log(scale(1)); // rgba(0, 128, 0, 1)
```

If you'd like to limit the domain and range like chroma-js, we recommend
wrapping scale again.

```js
const _scale = getScale('red', 'yellow', 'green');
const scale = x => _scale(x / 100);

console.log(scale(0)); // rgba(255, 0, 0, 1)
console.log(scale(50)); // rgba(255, 255, 0, 1)
console.log(scale(100)); // rgba(0, 128, 0, 1)
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `colors` | `string[]` | The colors to interpolate through. |

#### Returns

`(n: number) => string` - A function that maps a decimal percentage to an `rgba` color.

[Source](https://github.com/ricokahler/color2k/blob/main/src/getScale.ts)

### guard(low, high, value)

```ts
function guard(low: number, high: number, value: number): number
```

Clamps a number between a lower and upper bound.

```js
guard(0, 1, 2); // 1
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `low` | `number` | The lower bound. |
| `high` | `number` | The upper bound. |
| `value` | `number` | The number to clamp. |

#### Returns

`number` - The clamped number.

[Source](https://github.com/ricokahler/color2k/blob/main/src/guard.ts)

### hasBadContrast(color, standard, background)

```ts
function hasBadContrast(color: string, standard: 'decorative' | 'readable' | 'aa' | 'aaa' = 'aa', background: string = '#fff'): boolean
```

Returns whether a color fails a contrast threshold against a background.

The supported standards are `decorative`, `readable`, `aa`, and `aaa`.

```js
hasBadContrast('red', 'aa'); // true
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `color` | `string` | The foreground color. |
| `standard` | `'decorative' \| 'readable' \| 'aa' \| 'aaa' = 'aa'` | The contrast standard to test against. |
| `background` | `string = '#fff'` | The background color. |

#### Returns

`boolean` - `true` when the contrast ratio is below the selected standard.

[Source](https://github.com/ricokahler/color2k/blob/main/src/hasBadContrast.ts)

### hsla(hue, saturation, lightness, alpha)

```ts
function hsla(hue: number, saturation: number, lightness: number, alpha: number): string
```

Builds an `hsla` color string from hue, saturation, lightness, and alpha
channel values.

```js
hsla(0, 1, 0.5, 1); // 'hsla(0, 100%, 50%, 1)'
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `hue` | `number` | The color wheel angle from 0 to 360. |
| `saturation` | `number` | The saturation as a decimal between 0 and 1. |
| `lightness` | `number` | The lightness as a decimal between 0 and 1. |
| `alpha` | `number` | The opacity as a decimal between 0 and 1. |

#### Returns

`string` - An `hsla` color string.

[Source](https://github.com/ricokahler/color2k/blob/main/src/hsla.ts)

### lighten(color, amount)

```ts
function lighten(color: string, amount: number): string
```

Lightens a color by adding to the lightness channel in HSL space.

This is equivalent to `darken(color, -amount)`.

```js
lighten('black', 0.1); // 'hsla(0, 0%, 10%, 1)'
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `color` | `string` | The input color. |
| `amount` | `number` | The amount to lighten, given as a decimal between 0 and 1. |

#### Returns

`string` - The lightened color as an `hsla` string.

[Source](https://github.com/ricokahler/color2k/blob/main/src/lighten.ts)

### mix(color1, color2, weight)

```ts
function mix(color1: string, color2: string, weight: number): string
```

Mixes two colors together using the Sass mix algorithm and returns an `rgba`
color string.

```js
mix('red', 'blue', 0.5); // 'rgba(128, 0, 128, 1)'
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `color1` | `string` | The first color. |
| `color2` | `string` | The second color. |
| `weight` | `number` | The mix weight as a decimal between 0 and 1. |

#### Returns

`string` - The mixed color as an `rgba` string.

[Source](https://github.com/ricokahler/color2k/blob/main/src/mix.ts)

### opacify(color, amount)

```ts
function opacify(color: string, amount: number): string
```

Makes a color more opaque by increasing the alpha channel.

This is equivalent to `transparentize(color, -amount)`.

```js
opacify('rgba(255, 255, 255, 0.5)', 0.1); // 'rgba(255, 255, 255, 0.6)'
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `color` | `string` | The input color. |
| `amount` | `number` | The amount to increase opacity by, given as a decimal between 0 and 1. |

#### Returns

`string` - The more opaque color as an `rgba` string.

[Source](https://github.com/ricokahler/color2k/blob/main/src/opacify.ts)

### parseToHsla(color)

```ts
function parseToHsla(color: string): [number, number, number, number]
```

Parses a color into hue, saturation, lightness, and alpha channel values.

Hue is a number between 0 and 360. Saturation, lightness, and alpha are
decimal percentages between 0 and 1.

```js
parseToHsla('red'); // [0, 1, 0.5, 1]
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `color` | `string` | The input color. |

#### Returns

`[number, number, number, number]` - A tuple of hue, saturation, lightness, and alpha values.

[Source](https://github.com/ricokahler/color2k/blob/main/src/parseToHsla.ts)

### parseToRgba(color)

```ts
function parseToRgba(color: string): [number, number, number, number]
```

Parses a color into red, green, blue, and alpha channel values.

Supports hex, RGB, RGBA, HSL, HSLA, CSS named colors, and `transparent`.

```js
parseToRgba('rgba(255, 0, 0, 0.5)'); // [255, 0, 0, 0.5]
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `color` | `string` | The input color. |

#### Returns

`[number, number, number, number]` - A tuple of red, green, blue, and alpha channel values.

[Source](https://github.com/ricokahler/color2k/blob/main/src/parseToRgba.ts)

### readableColor(color)

```ts
function readableColor(color: string): string
```

Returns black or white, whichever has better contrast against the given
color.

```js
readableColor('white'); // '#000'
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `color` | `string` | The background color. |

#### Returns

`string` - `#000` or `#fff`.

[Source](https://github.com/ricokahler/color2k/blob/main/src/readableColor.ts)

### readableColorIsBlack(color)

```ts
function readableColorIsBlack(color: string): boolean
```

Returns whether black is the more readable color to place on top of the
input color.

This is the boolean form of `readableColor`.

```js
readableColorIsBlack('white'); // true
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `color` | `string` | The background color. |

#### Returns

`boolean` - `true` when black is the more readable foreground color.

[Source](https://github.com/ricokahler/color2k/blob/main/src/readableColorIsBlack.ts)

### rgba(red, green, blue, alpha)

```ts
function rgba(red: number, green: number, blue: number, alpha: number): string
```

Builds an `rgba` color string from red, green, blue, and alpha channel
values.

```js
rgba(255, 0, 0, 1); // 'rgba(255, 0, 0, 1)'
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `red` | `number` | The red channel value from 0 to 255. |
| `green` | `number` | The green channel value from 0 to 255. |
| `blue` | `number` | The blue channel value from 0 to 255. |
| `alpha` | `number` | The opacity as a decimal between 0 and 1. |

#### Returns

`string` - An `rgba` color string.

[Source](https://github.com/ricokahler/color2k/blob/main/src/rgba.ts)

### saturate(color, amount)

```ts
function saturate(color: string, amount: number): string
```

Saturates a color by adding to the saturation channel in HSL space.

This is equivalent to `desaturate(color, -amount)`.

```js
saturate('hsl(0, 50%, 50%)', 0.1); // 'hsla(0, 60%, 50%, 1)'
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `color` | `string` | The input color. |
| `amount` | `number` | The amount to saturate, given as a decimal between 0 and 1. |

#### Returns

`string` - The saturated color as an `hsla` string.

[Source](https://github.com/ricokahler/color2k/blob/main/src/saturate.ts)

### toHex(color)

```ts
function toHex(color: string): string
```

Converts a color to a hex color string.

Includes an alpha channel when the input color is not fully opaque.

```js
toHex('palevioletred'); // '#db7093'
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `color` | `string` | The input color. |

#### Returns

`string` - A hex color string.

[Source](https://github.com/ricokahler/color2k/blob/main/src/toHex.ts)

### toHsla(color)

```ts
function toHsla(color: string): string
```

Converts a color to an `hsla` color string.

```js
toHsla('peachpuff'); // 'hsla(28, 100%, 86%, 1)'
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `color` | `string` | The input color. |

#### Returns

`string` - An `hsla` color string.

[Source](https://github.com/ricokahler/color2k/blob/main/src/toHsla.ts)

### toRgba(color)

```ts
function toRgba(color: string): string
```

Converts a color to an `rgba` color string.

```js
toRgba('midnightblue'); // 'rgba(25, 25, 112, 1)'
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `color` | `string` | The input color. |

#### Returns

`string` - An `rgba` color string.

[Source](https://github.com/ricokahler/color2k/blob/main/src/toRgba.ts)

### transparentize(color, amount)

```ts
function transparentize(color: string, amount: number): string
```

Makes a color more transparent by decreasing the alpha channel.

```js
transparentize('white', 0.1); // 'rgba(255, 255, 255, 0.9)'
```

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `color` | `string` | The input color. |
| `amount` | `number` | The amount to increase transparency by, given as a decimal between 0 and 1. |

#### Returns

`string` - The more transparent color as an `rgba` string.

[Source](https://github.com/ricokahler/color2k/blob/main/src/transparentize.ts)
<!-- API-DOCS-END -->
