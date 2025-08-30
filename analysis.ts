// Analysis script to evaluate different compression approaches for named colors

// Extract all named colors from the test file
const namedColorMap = {
  aliceblue: 'f0f8ff',
  antiquewhite: 'faebd7',
  aqua: '00ffff',
  aquamarine: '7fffd4',
  azure: 'f0ffff',
  beige: 'f5f5dc',
  bisque: 'ffe4c4',
  black: '000',
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
  lightslategray: '789',
  lightslategrey: '789',
  lightsteelblue: 'b0c4de',
  lightyellow: 'ffffe0',
  lime: '0f0',
  limegreen: '32cd32',
  linen: 'faf0e6',
  magenta: 'f0f',
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
  rebeccapurple: '639',
  red: 'f00',
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
  white: 'fff',
  whitesmoke: 'f5f5f5',
  yellow: 'ff0',
  yellowgreen: '9acd32',
};

// Current implementation's hash function
function hash(str: string) {
  let hash = 5381;
  let i = str.length;

  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i);
  }

  return (hash >>> 0) % 2341;
}

const colorToInt = (x: string) => parseInt(x.replace(/_/g, ''), 36);

// Current compressed data (from the source)
const compressedColorMap =
  '1q29ehhb 1n09sgk7 1kl1ekf_ _yl4zsno 16z9eiv3 1p29lhp8 _bd9zg04 17u0____ _iw9zhe5 _to73___ _r45e31e _7l6g016 _jh8ouiv _zn3qba8 1jy4zshs 11u87k0u 1ro9yvyo 1aj3xael 1gz9zjz0 _3w8l4xo 1bf1ekf_ _ke3v___ _4rrkb__ 13j776yz _646mbhl _nrjr4__ _le6mbhl 1n37ehkb _m75f91n _qj3bzfz 1939yygw 11i5z6x8 _1k5f8xs 1509441m 15t5lwgf _ae2th1n _tg1ugcv 1lp1ugcv 16e14up_ _h55rw7n _ny9yavn _7a11xb_ 1ih442g9 _pv442g9 1mv16xof 14e6y7tu 1oo9zkds 17d1cisi _4v9y70f _y98m8kc 1019pq0v 12o9zda8 _348j4f4 1et50i2o _8epa8__ _ts6senj 1o350i2o 1mi9eiuo 1259yrp0 1ln80gnw _632xcoy 1cn9zldc _f29edu4 1n490c8q _9f9ziet 1b94vk74 _m49zkct 1kz6s73a 1eu9dtog _q58s1rz 1dy9sjiq __u89jo3 _aj5nkwg _ld89jo3 13h9z6wx _qa9z2ii _l119xgq _bs5arju 1hj4nwk9 1qt4nwk9 1ge6wau6 14j9zlcw 11p1edc_ _ms1zcxe _439shk6 _jt9y70f _754zsow 1la40eju _oq5p___ _x279qkz 1fa5r3rv _yd2d9ip _424tcku _8y1di2_ _zi2uabw _yy7rn9h 12yz980_ __39ljp6 1b59zg0x _n39zfzp 1fy9zest _b33k___ _hp9wq92 1il50hz4 _io472ub _lj9z3eo 19z9ykg0 _8t8iu3a 12b9bl4a 1ak5yw0o _896v4ku _tb8k8lv _s59zi6t _c09ze0p 1lg80oqn 1id9z8wb _238nba5 1kq6wgdi _154zssg _tn3zk49 _da9y6tc 1sg7cv4f _r12jvtt 1gq5fmkz 1cs9rvci _lp9jn1c _xw1tdnb 13f9zje6 16f6973h _vo7ir40 _bt5arjf _rc45e4t _hr4e100 10v4e100 _hc9zke2 _w91egv_ _sj2r1kk 13c87yx8 _vqpds__ _ni8ggk8 _tj9yqfb 1ia2j4r4 _7x9b10u 1fc9ld4j 1eq9zldr _5j9lhpx _ez9zl6o _md61fzm'.split(
    ' '
  );

console.log('=== CURRENT IMPLEMENTATION ANALYSIS ===');
console.log(`Total named colors: ${Object.keys(namedColorMap).length}`);
console.log(`Compressed data entries: ${compressedColorMap.length}`);
console.log(
  `Compressed string length: ${compressedColorMap.join(' ').length} characters`
);

// Analyze character frequency in color names
function analyzeNameFrequency() {
  console.log('\n=== CHARACTER FREQUENCY ANALYSIS ===');

  const charFreq: { [key: string]: number } = {};
  const prefixFreq: { [key: string]: number } = {};
  const suffixFreq: { [key: string]: number } = {};

  let totalChars = 0;

  Object.keys(namedColorMap).forEach((name) => {
    // Character frequency
    for (let char of name) {
      charFreq[char] = (charFreq[char] || 0) + 1;
      totalChars++;
    }

    // Prefix analysis (2-4 chars)
    for (let len = 2; len <= Math.min(4, name.length); len++) {
      const prefix = name.substring(0, len);
      prefixFreq[prefix] = (prefixFreq[prefix] || 0) + 1;
    }

    // Suffix analysis (2-4 chars)
    for (let len = 2; len <= Math.min(4, name.length); len++) {
      const suffix = name.substring(name.length - len);
      suffixFreq[suffix] = (suffixFreq[suffix] || 0) + 1;
    }
  });

  console.log('Most frequent characters:');
  Object.entries(charFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([char, freq]) => {
      console.log(
        `  '${char}': ${freq} (${((freq / totalChars) * 100).toFixed(1)}%)`
      );
    });

  console.log('\nMost frequent prefixes (2+ occurrences):');
  Object.entries(prefixFreq)
    .filter(([, freq]) => freq > 1)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .forEach(([prefix, freq]) => {
      console.log(`  '${prefix}': ${freq}`);
    });

  console.log('\nMost frequent suffixes (2+ occurrences):');
  Object.entries(suffixFreq)
    .filter(([, freq]) => freq > 1)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .forEach(([suffix, freq]) => {
      console.log(`  '${suffix}': ${freq}`);
    });
}

// Analyze hex value patterns
function analyzeHexValues() {
  console.log('\n=== HEX VALUE ANALYSIS ===');

  const hexLengths: { [key: number]: number } = {};
  const hexPatterns: { [key: string]: number } = {};

  Object.values(namedColorMap).forEach((hex) => {
    hexLengths[hex.length] = (hexLengths[hex.length] || 0) + 1;

    // Look for patterns like repeated chars
    if (hex.length === 3 && hex[0] === hex[1] && hex[1] === hex[2]) {
      hexPatterns['all_same_3'] = (hexPatterns['all_same_3'] || 0) + 1;
    }
    if (
      hex.length === 6 &&
      hex[0] === hex[1] &&
      hex[2] === hex[3] &&
      hex[4] === hex[5]
    ) {
      hexPatterns['repeated_pairs'] = (hexPatterns['repeated_pairs'] || 0) + 1;
    }
    if (
      hex === '000' ||
      hex === 'fff' ||
      hex === '000000' ||
      hex === 'ffffff'
    ) {
      hexPatterns['extremes'] = (hexPatterns['extremes'] || 0) + 1;
    }
  });

  console.log('Hex length distribution:');
  Object.entries(hexLengths).forEach(([len, count]) => {
    console.log(`  ${len} chars: ${count} colors`);
  });

  console.log('\nHex patterns:');
  Object.entries(hexPatterns).forEach(([pattern, count]) => {
    console.log(`  ${pattern}: ${count} colors`);
  });
}

// Calculate entropy
function calculateEntropy() {
  console.log('\n=== ENTROPY ANALYSIS ===');

  // Calculate entropy of concatenated color names
  const allNames = Object.keys(namedColorMap).join('');
  const charFreq: { [key: string]: number } = {};

  for (let char of allNames) {
    charFreq[char] = (charFreq[char] || 0) + 1;
  }

  let entropy = 0;
  const total = allNames.length;

  Object.values(charFreq).forEach((freq) => {
    const p = freq / total;
    entropy -= p * Math.log2(p);
  });

  console.log(`Character entropy: ${entropy.toFixed(3)} bits per char`);
  console.log(
    `Theoretical minimum bits needed: ${(allNames.length * entropy).toFixed(
      0
    )} bits`
  );
  console.log(
    `Theoretical minimum bytes needed: ${Math.ceil(
      (allNames.length * entropy) / 8
    ).toFixed(0)} bytes`
  );
  console.log(
    `Current approach (estimated): ${compressedColorMap.join(' ').length} bytes`
  );
}

analyzeNameFrequency();
analyzeHexValues();
calculateEntropy();

// Test different compression approaches
console.log('\n=== COMPRESSION APPROACH COMPARISON ===');

// Approach 1: Current implementation size
const currentSize = compressedColorMap.join(' ').length;
console.log(`Current approach: ${currentSize} bytes`);

// Approach 2: Direct JSON (baseline)
const jsonSize = JSON.stringify(namedColorMap).length;
console.log(`Direct JSON: ${jsonSize} bytes`);

// Approach 3: Trie-based compression
function buildTrie() {
  const trie: any = {};

  Object.entries(namedColorMap).forEach(([name, hex]) => {
    let node = trie;
    for (let char of name) {
      if (!node[char]) node[char] = {};
      node = node[char];
    }
    node._hex = hex;
  });

  return trie;
}

const trie = buildTrie();
const trieSize = JSON.stringify(trie).length;
console.log(`Trie approach: ${trieSize} bytes`);

// Approach 4: Prefix compression
function prefixCompress() {
  const prefixes = ['dark', 'light', 'medium', 'pale', 'deep'];
  const colors = Object.keys(namedColorMap);

  let compressed = '';
  colors.forEach((color) => {
    let found = false;
    for (let i = 0; i < prefixes.length; i++) {
      const prefix = prefixes[i];
      if (color.startsWith(prefix)) {
        compressed += `${i}${color.substring(prefix.length)}:${
          namedColorMap[color]
        } `;
        found = true;
        break;
      }
    }
    if (!found) {
      compressed += `_${color}:${namedColorMap[color]} `;
    }
  });

  return compressed.length;
}

const prefixCompressedSize = prefixCompress();
console.log(`Prefix compression: ${prefixCompressedSize} bytes`);
