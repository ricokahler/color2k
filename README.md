# [color2k](https://color2k.com) · [![https://badgen.net/bundlephobia/minzip/color2k](https://badgen.net/bundlephobia/minzip/color2k)](https://bundlephobia.com/result?p=color2k)

> a color parsing and manipulation lib served in 2kB or less (1.5kB to be more precise)

color2k is a color parsing and manipulation library with the objective of keeping the bundle size as small as possible while still satisfying all of your color manipulation needs in an sRGB space [(wide-gamut is not supported)](https://github.com/ricokahler/color2k/issues/16).

The bundle size is [currently 1.5kB](https://bundlephobia.com/result?p=color2k)

## Size comparison

| lib        | size                                                  | link                                                  |
| ---------- | ----------------------------------------------------- | ----------------------------------------------------- |
| polished   | [11.2kB](https://bundlephobia.com/result?p=polished)  | [repo](https://github.com/styled-components/polished) |
| chroma-js  | [13.7kB](https://bundlephobia.com/result?p=chroma-js) | [repo](https://github.com/gka/chroma.js)              |
| color      | [7.6kB](https://bundlephobia.com/result?p=color)      | [repo](https://github.com/Qix-/color)                 |
| tinycolor2 | [5kB](https://bundlephobia.com/result?p=tinycolor2)   | [repo](https://github.com/bgrins/TinyColor)           |
| color2k    | [1.5kB](https://bundlephobia.com/result?p=color2k)    | 😎                                                    |

## Installation

```
npm i --save color2k
```

If you need to server-side render any colors, you also need to install the node/ssr compatibility package.

```bash
# only needed in SSR environments (e.g. gatsby, next.js)
npm i --save @color2k/node
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

1. defer to the browser to [parse colors via canvas](https://github.com/ricokahler/color2k/blob/23589d4c6a9dc281d111f35bc2058a3fbf1bd805/packages/parse-to-rgba/src/index.ts#L63)
2. only support two color models as outputs, namely `rgba` and `hsla`

### Why canvas?

The browser already has the ability to parse colors via canvas. Other color libs use javascript to parse and transform colors. The result of making the browser parse the color is the removal of any code related to parsing colors resulting in a significantly smaller bundle.

Additionally, deferring to the browser for parsing colors means that this lib can parse any color that browser can parse. [This means that Apple's `display-p3` colors can be parsed with this lib in Safari.](https://github.com/ricokahler/color2k/issues/16#issuecomment-627574068)

### Why not canvas?

Using canvas is slower than parsing via javascript.

On my MacBook:

- Canvas: 58,588 ops/sec
- JavaScript: 3,335,123 ops/sec

[See here](https://jsperf.com/polished-vs-canvas/1)

In order to increase performance, already computed colors are [cached](https://github.com/ricokahler/color2k/blob/d33ecf6f905c17bec94cb879dedcf7b6ae5c5fae/packages/parse-to-rgba/src/index.ts#L37-L39).

### Why only `rgba` and `hsla` as outputs?

This lib was created with the use case of CSS-in-JS in mind. At the end of the day, all that matters is that the browser can understand the color string you gave it as a `background-color`.

Because only those two color models are supported, we don't have to add code to deal with optional alpha channels or converting to non-browser supported color models (e.g. CMYK).

We believe that this lib is sufficient for all of your color manipulation needs. If we're missing a feature, feel free to [open an issue](https://github.com/ricokahler/color2k/issues/new) 😎.

## Credits

Heavy credits goes to polished.js and sass. Much of the implementation of this lib is copied from polished!

<!-- DOCS-END -->

## API and Documentation

[Head over to the docs site](https://color2k.com)
