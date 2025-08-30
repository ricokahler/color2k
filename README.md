# [color2k 🎀](https://color2k.com)

[![bundlejs](https://deno.bundlejs.com/badge?q=color2k)](https://bundlejs.com/?q=color2k) [![github status checks](https://badgen.net/github/checks/ricokahler/color2k)](https://github.com/ricokahler/color2k/actions) [![codecov](https://codecov.io/gh/ricokahler/color2k/branch/master/graph/badge.svg)](https://codecov.io/gh/ricokahler/color2k) ![weekly downloads](https://badgen.net/npm/dw/color2k) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

> a simple color parsing and transformation library composed of pure, tree-shakable functions.
>
> — uncomplicated by design 😇

for simple usage, most bundles will end up being [roughly 2kB](https://bundlejs.com/?q=color2k&treeshake=%5B%7B+darken+%7D%5D).

## ✨ size comparison

| lib                                                       | size                                                 |
| --------------------------------------------------------- | ---------------------------------------------------- |
| [chroma-js](https://github.com/gka/chroma.js)             | [18.3 kB (gzip)](https://bundlejs.com/?q=chroma-js)  |
| [polished](https://github.com/styled-components/polished) | [12 kB (gzip)](https://bundlejs.com/?q=polished)     |
| [color](https://github.com/Qix-/color)                    | [8.48 kB (gzip)](https://bundlejs.com/?q=color)      |
| [tinycolor2](https://github.com/bgrins/TinyColor)         | [5.35 kB (gzip)](https://bundlejs.com/?q=tinycolor2) |
| color2k                                                   | [2.9 kB (gzip)](https://bundlejs.com/?q=color2k) 💖  |

> 👋 compare tree-shaken bundle outputs on [bundlejs.com](https://bundlejs.com/?q=color2k%402.0.3&treeshake=%5B%7B+darken+%7D%5D)

## 💾 installation

install with a package manager such as `npm`

```
npm i color2k
```

**OR** use with [skypack.dev](https://www.skypack.dev/) in supported environments (e.g. [deno](https://deno.land/manual/linking_to_external_code), [modern browsers](https://docs.skypack.dev/#whats-old-is-new-again)).

```js
import { darken, transparentize } from 'https://cdn.skypack.dev/color2k?min';
```

## 🛠️ usage

```js
import { darken, transparentize } from 'color2k';

// e.g.
darken('blue', 0.1); // hsla(240, 100%, 40%, 1)
transparentize('red', 0.5); // rgba(255, 0, 0, 0.9)
```

## 🤏 how so small?

there are three secrets that keep this lib especially small:

### simplicity

color2k is only a set of data-first pure functions—uncomplicated by design yet immediately useful.

### less branching

strings in. strings out.

nearly all functions:

1. take in the color as a string,
2. parse it to `rgba` or `hsla` (depending on the transformation),
3. apply the transformation,
4. and then return the result of that transform as a string.

this makes the library have much less code because it handles multiple inputs with the same parsing engine and results in very straight-forward and readable implementations

```ts
function darken(color: string, amount: number): string {
  const [hue, saturation, lightness, alpha] = parseToHsla(color);
  return hsla(hue, saturation, lightness - amount, alpha);
}
```

```ts
function transparentize(color: string, amount: number): string {
  const [r, g, b, a] = parseToRgba(color);
  return rgba(r, g, b, a - amount);
}
```

```ts
function desaturate(color: string, amount: number): string {
  const [h, s, l, a] = parseToHsla(color);
  return hsla(h, s - amount, l, a);
}
```

### the compressed color map of named colors 🤫

strings in, strings out also means having to handle any css [named-color](https://developer.mozilla.org/en-US/docs/Web/CSS/named-color).

in order to save on precious bytes, this library contains a "compressed" map of _hashed_ keys to hex values. the hash function used is lossy so that the resulting map of keys to hex values that has to go in the bundle is smaller.

```ts
function nameToHex(color: string): string {
  const normalizedColorName = color.toLowerCase().trim();
  const result = compressedColorMap[hash(normalizedColorName)];
  if (!result) throw new ColorError(color);
  return `#${result}`;
}
```

feel free to open an issue or pull request if you can think of ways to shrink this mechanism even more.

## 💖 credits and community

heavy credits goes to polished.js and sass. much of the implementation of this lib is proudly copied from polished!

thank you to the community for also keeping this lib up to date with current standards:

- **[@delucis](https://github.com/delucis)** [#409](https://github.com/ricokahler/color2k/pull/409)
- **[@Myndex](https://github.com/Myndex)** [#472](https://github.com/ricokahler/color2k/pull/472)

## 📚 reference

<a name="reference"></a>

<!-- begin api docs -->

jump to:

- [`adjustHue`](#adjust-hue)
- [`darken`](#darken)
- [`desaturate`](#desaturate)
- [`getContrast`](#get-contrast)
- [`getLuminance`](#get-luminance)
- [`getScale`](#get-scale)
- [`guard`](#guard)
- [`hasBadContrast`](#has-bad-contrast)
- [`hsla`](#hsla)
- [`lighten`](#lighten)
- [`mix`](#mix)
- [`opacify`](#opacify)
- [`parseToHsla`](#parse-to-hsla)
- [`parseToRgba`](#parse-to-rgba)
- [`readableColor`](#readable-color)
- [`readableColorIsBlack`](#readable-color-is-black)
- [`rgba`](#rgba)
- [`saturate`](#saturate)
- [`toHex`](#to-hex)
- [`toHsla`](#to-hsla)
- [`toRgba`](#to-rgba)
- [`transparentize`](#transparentize)

#### `adjustHue(color, degrees): string` | [🔝](#reference)

<a name="adjust-hue"></a>

Adjusts the current hue of the color by the given degrees. Wraps around when
over 360.

| Param     | Type     | Description                                                                                       |
| --------- | -------- | ------------------------------------------------------------------------------------------------- |
| `color`   | `string` | The input color                                                                                   |
| `degrees` | `number` | degrees to adjust the input color, accepts degree integers (0 - 360) and wraps around on overflow |

[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/adjustHue.ts) &nbsp; [see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/adjustHue.test.ts)

#### `darken(color, amount): string` | [🔝](#reference)

<a name="darken"></a>

Darkens using lightness. This is equivalent to subtracting the lightness
from the L in HSL.

| Param    | Type     | Description                                              |
| -------- | -------- | -------------------------------------------------------- |
| `color`  | `string` | The input color                                          |
| `amount` | `number` | The amount to darken, given as a decimal between 0 and 1 |

[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/darken.ts) &nbsp; [see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/darken.test.ts)

#### `desaturate(color, amount): string` | [🔝](#reference)

<a name="desaturate"></a>

Desaturates the input color by the given amount via subtracting from the `s`
in `hsla`.

| Param    | Type     | Description                                                  |
| -------- | -------- | ------------------------------------------------------------ |
| `color`  | `string` | The input color                                              |
| `amount` | `number` | The amount to desaturate, given as a decimal between 0 and 1 |

[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/desaturate.ts) &nbsp; [see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/desaturate.test.ts)

#### `getContrast(color1, color2): number` | [🔝](#reference)

<a name="get-contrast"></a>

Returns the contrast ratio between two colors based on
[W3's recommended equation for calculating contrast](http://www.w3.org/TR/WCAG20/#contrast-ratiodef).

| Param    | Type     | Description                                                                        |
| -------- | -------- | ---------------------------------------------------------------------------------- |
| `color1` | `string` | The input color                                                                    |
| `color2` | `string` | The second color that's compared against `color1` to calculate the contrast ratio. |

[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/getContrast.ts) &nbsp; [see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/getContrast.test.ts)

#### `getLuminance(color): number` | [🔝](#reference)

<a name="get-luminance"></a>

Returns a number (float) representing the luminance of a color.

| Param   | Type     | Description     |
| ------- | -------- | --------------- |
| `color` | `string` | The input color |

[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/getLuminance.ts) &nbsp; [see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/getLuminance.test.ts)

#### `getScale(colors): (n: number) => string` | [🔝](#reference)

<a name="get-scale"></a>

Creates a color scale function that interpolates colors within a given set of
colors. This function accepts an array of color strings and returns a new
function `scale(x)` that, when called with a decimal number between 0 and 1,
returns the color at that specific percentage along the color scale. The
colors are mixed linearly between the provided colors based on the input
percentage.

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
const scale = (x) => _scale(x / 100);

console.log(scale(0)); // rgba(255, 0, 0, 1)
console.log(scale(50)); // rgba(255, 255, 0, 1)
console.log(scale(100)); // rgba(0, 128, 0, 1)
```

| Param    | Type       | Description                                                         |
| -------- | ---------- | ------------------------------------------------------------------- |
| `colors` | `string[]` | An array of color strings used to define the stops along the scale. |

[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/getScale.ts) &nbsp; [see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/getScale.test.ts)

#### `guard(low, high, value): number` | [🔝](#reference)

<a name="guard"></a>

Clamps a given value within the inclusive lower and upper bounds specified by `low` and `high`.

```js
Math.min(Math.max(low, value), high);
```

| Param   | Type     | Description              |
| ------- | -------- | ------------------------ |
| `low`   | `number` | The lower bound          |
| `high`  | `number` | The upper bound          |
| `value` | `number` | The value being clamped. |

[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/guard.ts) &nbsp; [see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/guard.test.ts)

#### `hasBadContrast(color, standard, background): boolean` | [🔝](#reference)

<a name="has-bad-contrast"></a>

Returns whether or not a color has bad contrast against a background
according to a given standard.

| Param        | Type                                                 | Description                                                                                   |
| ------------ | ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `color`      | `string`                                             | The input color                                                                               |
| `standard`   | `'decorative' \| 'readable' \| 'aa' \| 'aaa' = 'aa'` | A string representing the accessibility standard against which to evaluate the color contrast |
| `background` | `string = '#fff'`                                    | The background color to test against the input `color`. Defaults to `#fff`                    |

[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/hasBadContrast.ts) &nbsp; [see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/hasBadContrast.test.ts)

#### `hsla(hue, saturation, lightness, alpha): string` | [🔝](#reference)

<a name="hsla"></a>

Takes in hsla parts and constructs an hsla string

| Param        | Type     | Description                                                                     |
| ------------ | -------- | ------------------------------------------------------------------------------- |
| `hue`        | `number` | The color circle (from 0 to 360) - 0 (or 360) is red, 120 is green, 240 is blue |
| `saturation` | `number` | Percentage of saturation, given as a decimal between 0 and 1                    |
| `lightness`  | `number` | Percentage of lightness, given as a decimal between 0 and 1                     |
| `alpha`      | `number` | Percentage of opacity, given as a decimal between 0 and 1                       |

[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/hsla.ts) &nbsp; [see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/hsla.test.ts)

#### `lighten(color, amount): string` | [🔝](#reference)

<a name="lighten"></a>

Lightens a color by a given amount. Equivalent to `darken(color, -amount)`.

| Param    | Type     | Description                                              |
| -------- | -------- | -------------------------------------------------------- |
| `color`  | `string` | The input color                                          |
| `amount` | `number` | The amount to darken, given as a decimal between 0 and 1 |

[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/lighten.ts) &nbsp; [see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/lighten.test.ts)

#### `mix(color1, color2, weight): string` | [🔝](#reference)

<a name="mix"></a>

Mixes two colors together based on a specified weight (credit to Sass).
The function calculates a new color by mixing the two input colors in
proportion to the weight and the inverse of the weight. The mixing considers
the alpha channel (transparency) of the colors, allowing for the creation of
semi-transparent colors if either or both input colors have transparency.

A weight of 0.5 mixes the two colors equally, while a weight closer to 0
favors `color1`, and a weight closer to 1 favors `color2`.

| Param    | Type     | Description                                                             |
| -------- | -------- | ----------------------------------------------------------------------- |
| `color1` | `string` | The first color to mix                                                  |
| `color2` | `string` | The second color to mix                                                 |
| `weight` | `number` | A number between 0 and 1 representing the weight of `color2` in the mix |

[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/mix.ts) &nbsp; [see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/mix.test.ts)

#### `opacify(color, amount): string` | [🔝](#reference)

<a name="opacify"></a>

Takes a color and removes transparency. Equivalent to `transparentize(color, -amount)`.

| Param    | Type     | Description                                                               |
| -------- | -------- | ------------------------------------------------------------------------- |
| `color`  | `string` | The input color                                                           |
| `amount` | `number` | The amount to increase the opacity by, given as a decimal between 0 and 1 |

[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/opacify.ts) &nbsp; [see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/opacify.test.ts)

#### `parseToHsla(color): [number, number, number, number]` | [🔝](#reference)

<a name="parse-to-hsla"></a>

Parses a color in hue, saturation, lightness, and the alpha channel.

Hue is a number between 0 and 360, saturation, lightness, and alpha are
decimal percentages between 0 and 1

| Param   | Type     | Description     |
| ------- | -------- | --------------- |
| `color` | `string` | The input color |

[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/parseToHsla.ts) &nbsp; [see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/parseToHsla.test.ts)

#### `parseToRgba(color): [number, number, number, number]` | [🔝](#reference)

<a name="parse-to-rgba"></a>

Parses a color into red, green, blue, alpha parts.

Red, green, and blue are integers between 0 and 255, alpha is a
decimal percentage between 0 and 1

| Param   | Type     | Description     |
| ------- | -------- | --------------- |
| `color` | `string` | The input color |

[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/parseToRgba.ts) &nbsp; [see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/parseToRgba.test.ts)

#### `readableColor(color): string` | [🔝](#reference)

<a name="readable-color"></a>

Returns black or white for best contrast depending on the luminosity of the
given color.

| Param   | Type     | Description     |
| ------- | -------- | --------------- |
| `color` | `string` | The input color |

[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/readableColor.ts) &nbsp; [see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/readableColor.test.ts)

#### `readableColorIsBlack(color): boolean` | [🔝](#reference)

<a name="readable-color-is-black"></a>

An alternative function to `readableColor`. Returns whether or not the
readable color (i.e. the color to be place on top the input color) should be
black.

| Param   | Type     | Description     |
| ------- | -------- | --------------- |
| `color` | `string` | The input color |

[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/readableColorIsBlack.ts) &nbsp; [see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/readableColorIsBlack.test.ts)

#### `rgba(red, green, blue, alpha): string` | [🔝](#reference)

<a name="rgba"></a>

Takes in rgba parts and returns an rgba string.

| Param   | Type     | Description                                                                           |
| ------- | -------- | ------------------------------------------------------------------------------------- |
| `red`   | `number` | The amount of red in the red channel, given in a number between 0 and 255 inclusive   |
| `green` | `number` | The amount of green in the red channel, given in a number between 0 and 255 inclusive |
| `blue`  | `number` | The amount of blue in the red channel, given in a number between 0 and 255 inclusive  |
| `alpha` | `number` | Percentage of opacity, given as a decimal between 0 and 1                             |

[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/rgba.ts) &nbsp; [see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/rgba.test.ts)

#### `saturate(color, amount): string` | [🔝](#reference)

<a name="saturate"></a>

Saturates a color by converting it to `hsl` and increasing the saturation
amount. Equivalent to `desaturate(color, -amount)`.

| Param    | Type     | Description                                              |
| -------- | -------- | -------------------------------------------------------- |
| `color`  | `string` | The input color                                          |
| `amount` | `number` | The amount to darken, given as a decimal between 0 and 1 |

[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/saturate.ts) &nbsp; [see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/saturate.test.ts)

#### `toHex(color): string` | [🔝](#reference)

<a name="to-hex"></a>

Takes in any color and returns it as a hex code.

| Param   | Type     | Description     |
| ------- | -------- | --------------- |
| `color` | `string` | The input color |

[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/toHex.ts) &nbsp; [see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/toHex.test.ts)

#### `toHsla(color): string` | [🔝](#reference)

<a name="to-hsla"></a>

Takes in any color and returns it as an hsla string.

| Param   | Type     | Description     |
| ------- | -------- | --------------- |
| `color` | `string` | The input color |

[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/toHsla.ts) &nbsp; [see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/toHsla.test.ts)

#### `toRgba(color): string` | [🔝](#reference)

<a name="to-rgba"></a>

Takes in any color and returns it as an rgba string.

| Param   | Type     | Description     |
| ------- | -------- | --------------- |
| `color` | `string` | The input color |

[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/toRgba.ts) &nbsp; [see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/toRgba.test.ts)

#### `transparentize(color, amount): string` | [🔝](#reference)

<a name="transparentize"></a>

Takes in a color and makes it more transparent by convert to `rgba` and
decreasing the amount in the alpha channel.

| Param    | Type     | Description                                                                    |
| -------- | -------- | ------------------------------------------------------------------------------ |
| `color`  | `string` | The input color                                                                |
| `amount` | `number` | The amount to increase the transparency by, given as a decimal between 0 and 1 |

[go to implementation →](https://github.com/ricokahler/color2k/blob/main/src/transparentize.ts) &nbsp; [see test for usage →](https://github.com/ricokahler/color2k/blob/main/src/transparentize.test.ts)
