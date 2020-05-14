# [color2k](https://color2k.com) · [![https://badgen.net/bundlephobia/minzip/color2k](https://badgen.net/bundlephobia/minzip/color2k)](https://bundlephobia.com/result?p=color2k)

> a color parsing and manipulation lib served in 2kB or less (1.5kB to be more precise)

color2k is a color parsing and manipulation library with the objective of keeping the bundle size as small as possible while still satisfying all of your color manipulation needs in an sRGB space [(wide-gamut is not supported)](https://github.com/ricokahler/color2k/issues/16).

The bundle size is [currently 1.5kB](https://bundlephobia.com/result?p=color2k)

## Size comparison

| lib                                                       | size                                                  |
| --------------------------------------------------------- | ----------------------------------------------------- |
| [polished](https://github.com/styled-components/polished) | [11.2kB](https://bundlephobia.com/result?p=polished)  |
| [chroma-js](https://github.com/gka/chroma.js)             | [13.7kB](https://bundlephobia.com/result?p=chroma-js) |
| [color](https://github.com/Qix-/color)                    | [7.6kB](https://bundlephobia.com/result?p=color)      |
| [tinycolor2](https://github.com/bgrins/TinyColor)         | [5kB](https://bundlephobia.com/result?p=tinycolor2)   |
| color2k                                                   | [1.5kB](https://bundlephobia.com/result?p=color2k) 😎 |

## Installation

```
npm i --save color2k
```

If you need to server-side render any colors, you also need to install the node/ssr compatibility package.

```bash
# only needed in SSR environments (e.g. gatsby, next.js)
npm i --save @color2k/compat
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

1. defer to the browser to [parse colors via `getComputedStyle`](https://github.com/ricokahler/color2k/blob/63905b1ad09312cc4e06f20961c6dfb930a3ceb3/packages/parse-to-rgba/src/index.ts#L63)
2. only support two color models as outputs, namely `rgba` and `hsla`

### Why `getComputedStyle`?

The browser already has the ability to parse colors via `getComputedStyle`. Other color libs use javascript to parse and transform colors. The result of making the browser parse the color is the removal of any code related to parsing colors resulting in a significantly smaller bundle.

### Why not `getComputedStyle`?

Using `getComputedStyle` is slower than parsing via javascript.

On my 2019 MacBook Pro:

- `getComputedStyle`: 594,499 ops/sec
- JavaScript: 3,335,123 ops/sec

[See here](https://jsperf.com/polished-vs-canvas/3)

In order to increase performance, already computed colors are [cached](https://github.com/ricokahler/color2k/blob/22941f75aa9216f2a581a02da41b7fb8f18ffba4/packages/parse-to-rgba/src/index.ts#L41).

### Why only `rgba` and `hsla` as outputs?

This lib was created with the use case of CSS-in-JS in mind. At the end of the day, all that matters is that the browser can understand the color string you gave it as a `background-color`.

Because only those two color models are supported, we don't have to add code to deal with optional alpha channels or converting to non-browser supported color models (e.g. CMYK).

We believe that this lib is sufficient for all of your color manipulation needs. If we're missing a feature, feel free to [open an issue](https://github.com/ricokahler/color2k/issues/new) 😎.

## Credits

Heavy credits goes to polished.js and sass. Much of the implementation of this lib is copied from polished!

<!-- DOCS-END -->

## API and Documentation

[Head over to the docs site](https://color2k.com)
