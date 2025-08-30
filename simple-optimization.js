// Simple optimization approach - remove spaces and extra padding

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

// Current hash function
function hash(str) {
  let hash = 5381;
  let i = str.length;
  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i);
  }
  return (hash >>> 0) % 2341;
}

console.log('=== SIMPLE OPTIMIZATION APPROACH ===\n');

// Current compressed string (reconstructed)
const currentCompressed =
  '1q29ehhb 1n09sgk7 1kl1ekf_ _yl4zsno 16z9eiv3 1p29lhp8 _bd9zg04 17u0____ _iw9zhe5 _to73___ _r45e31e _7l6g016 _jh8ouiv _zn3qba8 1jy4zshs 11u87k0u 1ro9yvyo 1aj3xael 1gz9zjz0 _3w8l4xo 1bf1ekf_ _ke3v___ _4rrkb__ 13j776yz _646mbhl _nrjr4__ _le6mbhl 1n37ehkb _m75f91n _qj3bzfz 1939yygw 11i5z6x8 _1k5f8xs 1509441m 15t5lwgf _ae2th1n _tg1ugcv 1lp1ugcv 16e14up_ _h55rw7n _ny9yavn _7a11xb_ 1ih442g9 _pv442g9 1mv16xof 14e6y7tu 1oo9zkds 17d1cisi _4v9y70f _y98m8kc 1019pq0v 12o9zda8 _348j4f4 1et50i2o _8epa8__ _ts6senj 1o350i2o 1mi9eiuo 1259yrp0 1ln80gnw _632xcoy 1cn9zldc _f29edu4 1n490c8q _9f9ziet 1b94vk74 _m49zkct 1kz6s73a 1eu9dtog _q58s1rz 1dy9sjiq __u89jo3 _aj5nkwg _ld89jo3 13h9z6wx _qa9z2ii _l119xgq _bs5arju 1hj4nwk9 1qt4nwk9 1ge6wau6 14j9zlcw 11p1edc_ _ms1zcxe _439shk6 _jt9y70f _754zsow 1la40eju _oq5p___ _x279qkz 1fa5r3rv _yd2d9ip _424tcku _8y1di2_ _zi2uabw _yy7rn9h 12yz980_ __39ljp6 1b59zg0x _n39zfzp 1fy9zest _b33k___ _hp9wq92 1il50hz4 _io472ub _lj9z3eo 19z9ykg0 _8t8iu3a 12b9bl4a 1ak5yw0o _896v4ku _tb8k8lv _s59zi6t _c09ze0p 1lg80oqn 1id9z8wb _238nba5 1kq6wgdi _154zssg _tn3zk49 _da9y6tc 1sg7cv4f _r12jvtt 1gq5fmkz 1cs9rvci _lp9jn1c _xw1tdnb 13f9zje6 16f6973h _vo7ir40 _bt5arjf _rc45e4t _hr4e100 10v4e100 _hc9zke2 _w91egv_ _sj2r1kk 13c87yx8 _vqpds__ _ni8ggk8 _tj9yqfb 1ia2j4r4 _7x9b10u 1fc9ld4j 1eq9zldr _5j9lhpx _ez9zl6o _md61fzm'.split(
    ' '
  );

console.log(
  `Current compressed size: ${currentCompressed.join(' ').length} bytes`
);

// Simple optimization 1: Just remove spaces
const optimized1 = currentCompressed.join('');
console.log(
  `Optimization 1 (no spaces): ${optimized1.length} bytes (saves ${
    1331 - optimized1.length
  } bytes)`
);

// Simple optimization 2: Remove leading underscores if not needed for disambiguation
let optimized2 = '';
currentCompressed.forEach((entry) => {
  // Remove leading underscores that don't cause ambiguity
  if (entry.startsWith('_') && entry.length === 8) {
    // If removing the underscore doesn't make it look like a different format, remove it
    const withoutUnderscore = entry.substring(1);
    optimized2 += withoutUnderscore;
  } else {
    optimized2 += entry;
  }
});
console.log(
  `Optimization 2 (remove underscores): ${optimized2.length} bytes (saves ${
    1331 - optimized2.length
  } bytes)`
);

// Test the simplest optimization
function testSimpleOptimization() {
  console.log('\n--- Testing Simple Optimization ---');

  const colorToInt = (x) => parseInt(x.replace(/_/g, ''), 36);

  // Rebuild the color map using optimized1 (just no spaces)
  const optimizedColorMap = {};

  // Parse entries from the space-free string
  // Each entry is 8 characters (3 for key, 5-8 for hex value with padding)
  for (let i = 0; i < optimized1.length; i += 8) {
    const entry = optimized1.substring(i, i + 8);
    if (entry.length === 8) {
      const key = colorToInt(entry.substring(0, 3));
      const hexPart = entry.substring(3);
      const hex = colorToInt(hexPart).toString(16);

      // Add padding if needed (replicating original logic)
      let prefix = '';
      for (let j = 0; j < 6 - hex.length; j++) {
        prefix += '0';
      }

      optimizedColorMap[key] = `${prefix}${hex}`;
    }
  }

  console.log(`Parsed ${Object.keys(optimizedColorMap).length} colors`);

  // Test all colors
  let successCount = 0;
  let failCount = 0;

  Object.keys(namedColorMap).forEach((name) => {
    const expectedHex = namedColorMap[name];
    const h = hash(name);
    const actualHex = optimizedColorMap[h];

    if (actualHex === expectedHex) {
      successCount++;
    } else {
      console.log(
        `❌ ${name}: expected ${expectedHex}, got ${actualHex}, hash: ${h}`
      );
      failCount++;
    }
  });

  console.log(`✅ ${successCount} colors correct`);
  console.log(`❌ ${failCount} colors failed`);

  if (failCount === 0) {
    console.log('\n🎉 Simple optimization works!');
    return optimized1;
  }

  return null;
}

const validOptimization = testSimpleOptimization();

if (validOptimization) {
  console.log(`\n=== FINAL RESULT ===`);
  console.log(`Original size: 1331 bytes`);
  console.log(`Optimized size: ${validOptimization.length} bytes`);
  console.log(
    `Savings: ${1331 - validOptimization.length} bytes (${(
      ((1331 - validOptimization.length) / 1331) *
      100
    ).toFixed(1)}%)`
  );

  console.log('\nOptimized compressed string:');
  console.log(`'${validOptimization}'`);

  console.log('\nUpdated code for parseToRgba.ts:');
  console.log(`
const compressedColorMap = '${validOptimization}'
  .match(/.{8}/g) // Split into 8-character chunks
  .reduce((acc, next) => {
    const key = colorToInt(next.substring(0, 3));
    const hex = colorToInt(next.substring(3)).toString(16);
    
    let prefix = '';
    for (let i = 0; i < 6 - hex.length; i++) {
      prefix += '0';
    }
    
    acc[key] = \`\${prefix}\${hex}\`;
    return acc;
  }, {} as { [key: string]: string });
`);
}
