import guard from './guard';
import ColorError from './ColorError';

/**
 * Parses a color into red, gree, blue, alpha parts
 *
 * @param color the input color. Can be a RGB, RBGA, HSL, HSLA, or named color
 */
function parseToRgba(color: string): [number, number, number, number] {
  if (typeof color !== 'string') throw new ColorError(color);
  if (color.trim().toLowerCase() === 'transparent') return [0, 0, 0, 0];

  let normalizedColor = color.trim();
  normalizedColor = namedColorRegex.test(color) ? nameToHex(color) : color;

  const reducedHexMatch = reducedHexRegex.exec(normalizedColor);
  if (reducedHexMatch) {
    const arr = Array.from(reducedHexMatch).slice(1);
    return [
      ...arr.slice(0, 3).map((x) => parseInt(r(x, 2), 16)),
      parseInt(r(arr[3] || 'f', 2), 16) / 255,
    ] as [number, number, number, number];
  }

  const hexMatch = hexRegex.exec(normalizedColor);
  if (hexMatch) {
    const arr = Array.from(hexMatch).slice(1);
    return [
      ...arr.slice(0, 3).map((x) => parseInt(x, 16)),
      parseInt(arr[3] || 'ff', 16) / 255,
    ] as [number, number, number, number];
  }

  const rgbaMatch = rgbaRegex.exec(normalizedColor);
  if (rgbaMatch) {
    const arr = Array.from(rgbaMatch).slice(1);
    return [
      ...arr.slice(0, 3).map((x) => parseInt(x, 10)),
      parseFloat(arr[3] || '1'),
    ] as [number, number, number, number];
  }

  const hslaMatch = hslaRegex.exec(normalizedColor);
  if (hslaMatch) {
    const [h, s, l, a] = Array.from(hslaMatch).slice(1).map(parseFloat);
    if (guard(0, 100, s) !== s) throw new ColorError(color);
    if (guard(0, 100, l) !== l) throw new ColorError(color);
    return [...hslToRgb(h, s, l), Number.isNaN(a) ? 1 : a] as [
      number,
      number,
      number,
      number
    ];
  }

  throw new ColorError(color);
}

function hash(str: string) {
  let hash = 5381;
  let i = str.length;

  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i);
  }

  /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
   * integers. Since we want the results to be always positive, convert the
   * signed int to an unsigned by doing an unsigned bitshift. */
  return (hash >>> 0) % 2341;
}

const colorToInt = (x: string) => parseInt(x.replace(/_/g, ''), 36);

const compressedColorMap =
  '1q29ehhb 1n09sgk7 1kl1ekf_ _yl4zsno 16z9eiv3 1p29lhp8 _bd9zg04 17u0____ _iw9zhe5 _to73___ _r45e31e _7l6g016 _jh8ouiv _zn3qba8 1jy4zshs 11u87k0u 1ro9yvyo 1aj3xael 1gz9zjz0 _3w8l4xo 1bf1ekf_ _ke3v___ _4rrkb__ 13j776yz _646mbhl _nrjr4__ _le6mbhl 1n37ehkb _m75f91n _qj3bzfz 1939yygw 11i5z6x8 _1k5f8xs 1509441m 15t5lwgf _ae2th1n _tg1ugcv 1lp1ugcv 16e14up_ _h55rw7n _ny9yavn _7a11xb_ 1ih442g9 _pv442g9 1mv16xof 14e6y7tu 1oo9zkds 17d1cisi _4v9y70f _y98m8kc 1019pq0v 12o9zda8 _348j4f4 1et50i2o _8epa8__ _ts6senj 1o350i2o 1mi9eiuo 1259yrp0 1ln80gnw _632xcoy 1cn9zldc _f29edu4 1n490c8q _9f9ziet 1b94vk74 _m49zkct 1kz6s73a 1eu9dtog _q58s1rz 1dy9sjiq __u89jo3 _aj5nkwg _ld89jo3 13h9z6wx _qa9z2ii _l119xgq _bs5arju 1hj4nwk9 1qt4nwk9 1ge6wau6 14j9zlcw 11p1edc_ _ms1zcxe _439shk6 _jt9y70f _754zsow 1la40eju _oq5p___ _x279qkz 1fa5r3rv _yd2d9ip _424tcku _8y1di2_ _zi2uabw _yy7rn9h 12yz980_ __39ljp6 1b59zg0x _n39zfzp 1fy9zest _b33k___ _hp9wq92 1il50hz4 _io472ub _lj9z3eo 19z9ykg0 _8t8iu3a 12b9bl4a 1ak5yw0o _896v4ku _tb8k8lv _s59zi6t _c09ze0p 1lg80oqn 1id9z8wb _238nba5 1kq6wgdi _154zssg _tn3zk49 _da9y6tc 1sg7cv4f _r12jvtt 1gq5fmkz 1cs9rvci _lp9jn1c _xw1tdnb 13f9zje6 16f6973h _vo7ir40 _bt5arjf _rc45e4t _hr4e100 10v4e100 _hc9zke2 _w91egv_ _sj2r1kk 13c87yx8 _vqpds__ _ni8ggk8 _tj9yqfb 1ia2j4r4 _7x9b10u 1fc9ld4j 1eq9zldr _5j9lhpx _ez9zl6o _md61fzm'
    .split(' ')
    .reduce((acc, next) => {
      const key = colorToInt(next.substring(0, 3));
      const hex = colorToInt(next.substring(3)).toString(16);

      // NOTE: padStart could be used here but it breaks Node 6 compat
      // https://github.com/ricokahler/color2k/issues/351
      let prefix = '';
      for (let i = 0; i < 6 - hex.length; i++) {
        prefix += '0';
      }

      acc[key] = `${prefix}${hex}`;
      return acc;
    }, {} as { [key: string]: string });

/**
 * Checks if a string is a CSS named color and returns its equivalent hex value, otherwise returns the original color.
 */
function nameToHex(color: string): string {
  const normalizedColorName = color.toLowerCase().trim();
  const result = compressedColorMap[hash(normalizedColorName)];
  if (!result) throw new ColorError(color);
  return `#${result}`;
}

const r = (str: string, amount: number) =>
  Array.from(Array(amount))
    .map(() => str)
    .join('');

const reducedHexRegex = new RegExp(`^#${r('([a-f0-9])', 3)}([a-f0-9])?$`, 'i');
const hexRegex = new RegExp(`^#${r('([a-f0-9]{2})', 3)}([a-f0-9]{2})?$`, 'i');
const rgbaRegex = new RegExp(
  `^rgba?\\(\\s*(\\d+)\\s*${r(
    ',\\s*(\\d+)\\s*',
    2
  )}(?:,\\s*([\\d.]+))?\\s*\\)$`,
  'i'
);
const hslaRegex =
  /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)$/i;
const namedColorRegex = /^[a-z]+$/i;

const roundColor = (color: number): number => {
  return Math.round(color * 255);
};

const hslToRgb = (
  hue: number,
  saturation: number,
  lightness: number
): [number, number, number] => {
  let l = lightness / 100;
  if (saturation === 0) {
    // achromatic
    return [l, l, l].map(roundColor) as [number, number, number];
  }

  // formulae from https://en.wikipedia.org/wiki/HSL_and_HSV
  const huePrime = (((hue % 360) + 360) % 360) / 60;
  const chroma = (1 - Math.abs(2 * l - 1)) * (saturation / 100);
  const secondComponent = chroma * (1 - Math.abs((huePrime % 2) - 1));

  let red = 0;
  let green = 0;
  let blue = 0;

  if (huePrime >= 0 && huePrime < 1) {
    red = chroma;
    green = secondComponent;
  } else if (huePrime >= 1 && huePrime < 2) {
    red = secondComponent;
    green = chroma;
  } else if (huePrime >= 2 && huePrime < 3) {
    green = chroma;
    blue = secondComponent;
  } else if (huePrime >= 3 && huePrime < 4) {
    green = secondComponent;
    blue = chroma;
  } else if (huePrime >= 4 && huePrime < 5) {
    red = secondComponent;
    blue = chroma;
  } else if (huePrime >= 5 && huePrime < 6) {
    red = chroma;
    blue = secondComponent;
  }

  const lightnessModification = l - chroma / 2;
  const finalRed = red + lightnessModification;
  const finalGreen = green + lightnessModification;
  const finalBlue = blue + lightnessModification;

  return [finalRed, finalGreen, finalBlue].map(roundColor) as [
    number,
    number,
    number
  ];
};

export default parseToRgba;
