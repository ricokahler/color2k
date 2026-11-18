// Generates the `colorMap` string used by `src/parseToRgba.ts`.
//
//   node scripts/color-map.js          # check that the source is up to date
//   node scripts/color-map.js --write  # rewrite the string in the source
//
// Format (see also the comment above `colorMap` in the source):
//
// - Every name is hashed to a key in [0, MOD). Entries are sorted by key.
// - An entry is 5 characters: [gap][r][g][b][pages]. Every character holds a
//   value `v` that is read back as `charCode % 95`, i.e. 0..31 are stored as
//   `_` to `~` and 32..94 are stored as-is. That keeps the string on
//   characters minified JS already uses a lot, which is what gzip likes.
// - gap: this key minus the previous key, plus GAP_OFFSET.
// - r, g, b: the low 6 bits of `BYTE_OFFSET - byte`.
// - pages: three 2-bit values (r, g, b) holding what the low 6 bits lose, so
//   that `byte = (BYTE_OFFSET - v + 64 * page) & 255`.
//
// SEED, MULT, MOD, GAP_OFFSET and BYTE_OFFSET were picked by a search for the
// smallest gzipped bundle. Any values that pass the checks below work, they
// only have to match the constants in `src/parseToRgba.ts`. MOD sets how often
// an unknown name is mistaken for a color (about 148 / MOD).
const fs = require('fs');
const path = require('path');

const SEED = 47;
const MULT = 65;
const MOD = 2476;
const GAP_OFFSET = 1;
const BYTE_OFFSET = 168;

const colors = {
  aliceblue: 'f0f8ff',
  antiquewhite: 'faebd7',
  aqua: '00ffff',
  aquamarine: '7fffd4',
  azure: 'f0ffff',
  beige: 'f5f5dc',
  bisque: 'ffe4c4',
  black: '000000',
  blanchedalmond: 'ffebcd',
  blue: '0000ff',
  blueviolet: '8a2be2',
  brown: 'a52a2a',
  burlywood: 'deb887',
  cadetblue: '5f9ea0',
  chartreuse: '7fff00',
  chocolate: 'd2691e',
  coral: 'ff7f50',
  cornflowerblue: '6495ed',
  cornsilk: 'fff8dc',
  crimson: 'dc143c',
  cyan: '00ffff',
  darkblue: '00008b',
  darkcyan: '008b8b',
  darkgoldenrod: 'b8860b',
  darkgray: 'a9a9a9',
  darkgreen: '006400',
  darkgrey: 'a9a9a9',
  darkkhaki: 'bdb76b',
  darkmagenta: '8b008b',
  darkolivegreen: '556b2f',
  darkorange: 'ff8c00',
  darkorchid: '9932cc',
  darkred: '8b0000',
  darksalmon: 'e9967a',
  darkseagreen: '8fbc8f',
  darkslateblue: '483d8b',
  darkslategray: '2f4f4f',
  darkslategrey: '2f4f4f',
  darkturquoise: '00ced1',
  darkviolet: '9400d3',
  deeppink: 'ff1493',
  deepskyblue: '00bfff',
  dimgray: '696969',
  dimgrey: '696969',
  dodgerblue: '1e90ff',
  firebrick: 'b22222',
  floralwhite: 'fffaf0',
  forestgreen: '228b22',
  fuchsia: 'ff00ff',
  gainsboro: 'dcdcdc',
  ghostwhite: 'f8f8ff',
  gold: 'ffd700',
  goldenrod: 'daa520',
  gray: '808080',
  green: '008000',
  greenyellow: 'adff2f',
  grey: '808080',
  honeydew: 'f0fff0',
  hotpink: 'ff69b4',
  indianred: 'cd5c5c',
  indigo: '4b0082',
  ivory: 'fffff0',
  khaki: 'f0e68c',
  lavender: 'e6e6fa',
  lavenderblush: 'fff0f5',
  lawngreen: '7cfc00',
  lemonchiffon: 'fffacd',
  lightblue: 'add8e6',
  lightcoral: 'f08080',
  lightcyan: 'e0ffff',
  lightgoldenrodyellow: 'fafad2',
  lightgray: 'd3d3d3',
  lightgreen: '90ee90',
  lightgrey: 'd3d3d3',
  lightpink: 'ffb6c1',
  lightsalmon: 'ffa07a',
  lightseagreen: '20b2aa',
  lightskyblue: '87cefa',
  lightslategray: '778899',
  lightslategrey: '778899',
  lightsteelblue: 'b0c4de',
  lightyellow: 'ffffe0',
  lime: '00ff00',
  limegreen: '32cd32',
  linen: 'faf0e6',
  magenta: 'ff00ff',
  maroon: '800000',
  mediumaquamarine: '66cdaa',
  mediumblue: '0000cd',
  mediumorchid: 'ba55d3',
  mediumpurple: '9370db',
  mediumseagreen: '3cb371',
  mediumslateblue: '7b68ee',
  mediumspringgreen: '00fa9a',
  mediumturquoise: '48d1cc',
  mediumvioletred: 'c71585',
  midnightblue: '191970',
  mintcream: 'f5fffa',
  mistyrose: 'ffe4e1',
  moccasin: 'ffe4b5',
  navajowhite: 'ffdead',
  navy: '000080',
  oldlace: 'fdf5e6',
  olive: '808000',
  olivedrab: '6b8e23',
  orange: 'ffa500',
  orangered: 'ff4500',
  orchid: 'da70d6',
  palegoldenrod: 'eee8aa',
  palegreen: '98fb98',
  paleturquoise: 'afeeee',
  palevioletred: 'db7093',
  papayawhip: 'ffefd5',
  peachpuff: 'ffdab9',
  peru: 'cd853f',
  pink: 'ffc0cb',
  plum: 'dda0dd',
  powderblue: 'b0e0e6',
  purple: '800080',
  rebeccapurple: '663399',
  red: 'ff0000',
  rosybrown: 'bc8f8f',
  royalblue: '4169e1',
  saddlebrown: '8b4513',
  salmon: 'fa8072',
  sandybrown: 'f4a460',
  seagreen: '2e8b57',
  seashell: 'fff5ee',
  sienna: 'a0522d',
  silver: 'c0c0c0',
  skyblue: '87ceeb',
  slateblue: '6a5acd',
  slategray: '708090',
  slategrey: '708090',
  snow: 'fffafa',
  springgreen: '00ff7f',
  steelblue: '4682b4',
  tan: 'd2b48c',
  teal: '008080',
  thistle: 'd8bfd8',
  tomato: 'ff6347',
  turquoise: '40e0d0',
  violet: 'ee82ee',
  wheat: 'f5deb3',
  white: 'ffffff',
  whitesmoke: 'f5f5f5',
  yellow: 'ffff00',
  yellowgreen: '9acd32',
};

function hash(name) {
  let h = SEED;
  let i = name.length;
  while (i) h = (((h * MULT) ^ name.charCodeAt(--i)) | 32) % MOD;
  return h;
}

function char(value) {
  const code = value < 32 ? value + 95 : value;
  // no backslashes so the literal never needs an escape that changes meaning
  if (value < 0 || value > 94 || code === 92) {
    throw new Error(`Value ${value} does not fit in one character`);
  }
  return String.fromCharCode(code);
}

function encode() {
  const entries = Object.keys(colors)
    .map((name) => ({ name, key: hash(name) }))
    .sort((a, b) => a.key - b.key);

  let result = '';
  let previous = 0;
  for (const { name, key } of entries) {
    if (key === previous) throw new Error(`Hash collision at ${name}`);
    result += char(key - previous + GAP_OFFSET);
    previous = key;

    let pages = 0;
    for (let i = 0; i < 6; i += 2) {
      const byte = parseInt(colors[name].substr(i, 2), 16);
      const value = (BYTE_OFFSET - byte) & 63;
      result += char(value);
      pages = (pages << 2) | (((byte + value - BYTE_OFFSET) >> 6) & 3);
    }
    result += char(pages);
  }
  return result;
}

// mirrors the lookup in src/parseToRgba.ts
function decode(colorMap, name) {
  let h = hash(name);
  let i = 0;
  for (; (h -= (colorMap.charCodeAt(i) % 95) - GAP_OFFSET) > 0; i += 5);
  if (h !== 0) return null;
  return [1, 2, 3]
    .map(
      (j) =>
        (BYTE_OFFSET -
          (colorMap.charCodeAt(i + j) % 95) +
          ((colorMap.charCodeAt(i + 4) % 95) >> (6 - 2 * j)) * 64) &
        255,
    )
    .map((byte) => (byte < 16 ? '0' : '') + byte.toString(16))
    .join('');
}

const colorMap = encode();
for (const name of Object.keys(colors)) {
  if (decode(colorMap, name) !== colors[name]) {
    throw new Error(`Round trip failed for ${name}`);
  }
}

const literal = `'${colorMap.replace(/'/g, "\\'")}'`;
const file = path.resolve(__dirname, '../src/parseToRgba.ts');
const source = fs.readFileSync(file, 'utf8');
const pattern = /(const colorMap =\s*)'(?:[^'\\\n]|\\.)*'/;
if (!pattern.test(source)) throw new Error('colorMap not found in source');
const updated = source.replace(pattern, (_, start) => start + literal);

if (process.argv.includes('--write')) {
  fs.writeFileSync(file, updated);
  console.log('Updated src/parseToRgba.ts');
} else if (updated !== source) {
  console.error('src/parseToRgba.ts is out of date, run with --write');
  process.exit(1);
} else {
  console.log(`colorMap is up to date (${colorMap.length} characters)`);
}
