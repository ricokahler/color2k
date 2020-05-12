# [color2k](https://color2k.com) · [![https://badgen.net/bundlephobia/minzip/color2k](https://badgen.net/bundlephobia/minzip/color2k)](https://bundlephobia.com/result?p=color2k)

> a color parsing and manipulation lib served in 2kB or less (1.5kB to be more precise)

color2k is a color parsing and manipulation library with the objective of keeping the bundle size as small as possible.

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

You can also chain together color functions with `vary`:

```js
import { darken, transparentize, vary } from 'color2k';

vary('red', [
  [darken, 0.1],
  [transparentize, 0.1],
]);
```

## How so small?

There are two secrets that keep this lib especially small:

1. defer to the browser to [parse colors via canvas](https://github.com/ricokahler/color2k/blob/23589d4c6a9dc281d111f35bc2058a3fbf1bd805/packages/parse-to-rgba/src/index.ts#L63)
2. small API footprint 🤷‍♀️

## Credits

Heavy credits goes to polished.js and sass. Much of the implementation of this lib is copied from polished!

<!-- DOCS-END -->

## API and Documentation

[Head over to the docs site](https://color2k.com)
