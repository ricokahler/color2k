import guard from './guard';
import ColorError from './ColorError';

/**
 * Parses a color into red, gree, blue, alpha parts
 *
 * @param color the input color. Can be a RGB, RBGA, HSL, HSLA, HWB, lab, lch, oklab, oklch, color(), or named color
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

  // Modern space-separated rgb/rgba: rgb(255 0 0) or rgb(255 0 0 / 0.5)
  const rgbaModernMatch = rgbaModernRegex.exec(normalizedColor);
  if (rgbaModernMatch) {
    const [, rs, gs, bs, alphaS] = rgbaModernMatch;
    return [
      parseRgbComponent(rs),
      parseRgbComponent(gs),
      parseRgbComponent(bs),
      parseAlpha(alphaS),
    ];
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

  // Modern space-separated hsl/hsla: hsl(120 100% 50%) or hsl(120 100% 50% / 0.5)
  const hslaModernMatch = hslaModernRegex.exec(normalizedColor);
  if (hslaModernMatch) {
    const [, hs, ss, ls, alphaS] = hslaModernMatch;
    const h = parseAngle(hs);
    const s = parseFloat(ss);
    const l = parseFloat(ls);
    if (guard(0, 100, s) !== s) throw new ColorError(color);
    if (guard(0, 100, l) !== l) throw new ColorError(color);
    return [...hslToRgb(h, s, l), parseAlpha(alphaS)] as [
      number,
      number,
      number,
      number
    ];
  }

  // hwb(H W B) or hwb(H W B / alpha)
  const hwbMatch = hwbRegex.exec(normalizedColor);
  if (hwbMatch) {
    const [, hs, ws, bs, alphaS] = hwbMatch;
    const h = parseAngle(hs);
    const w = parseFloat(ws) / 100;
    const b = parseFloat(bs) / 100;
    return [...hwbToRgb(h, w, b), parseAlpha(alphaS)] as [
      number,
      number,
      number,
      number
    ];
  }

  const labMatch = labRegex.exec(normalizedColor);
  if (labMatch) {
    const [, Ls, as_, bs, alphaS] = labMatch;
    const L = Ls.endsWith('%') ? parseFloat(Ls) : parseFloat(Ls);
    const a = as_.endsWith('%') ? (parseFloat(as_) / 100) * 125 : parseFloat(as_);
    const b = bs.endsWith('%') ? (parseFloat(bs) / 100) * 125 : parseFloat(bs);
    return labToRgba(L, a, b, parseAlpha(alphaS));
  }

  const lchMatch = lchRegex.exec(normalizedColor);
  if (lchMatch) {
    const [, Ls, Cs, Hs, alphaS] = lchMatch;
    const L = Ls.endsWith('%') ? parseFloat(Ls) : parseFloat(Ls);
    const C = Cs.endsWith('%') ? (parseFloat(Cs) / 100) * 150 : parseFloat(Cs);
    const H = parseAngle(Hs);
    return lchToRgba(L, C, H, parseAlpha(alphaS));
  }

  const oklabMatch = oklabRegex.exec(normalizedColor);
  if (oklabMatch) {
    const [, Ls, as_, bs, alphaS] = oklabMatch;
    const L = Ls.endsWith('%') ? parseFloat(Ls) / 100 : parseFloat(Ls);
    const a = as_.endsWith('%') ? (parseFloat(as_) / 100) * 0.4 : parseFloat(as_);
    const b = bs.endsWith('%') ? (parseFloat(bs) / 100) * 0.4 : parseFloat(bs);
    return oklabToRgba(L, a, b, parseAlpha(alphaS));
  }

  const oklchMatch = oklchRegex.exec(normalizedColor);
  if (oklchMatch) {
    const [, Ls, Cs, Hs, alphaS] = oklchMatch;
    const L = Ls.endsWith('%') ? parseFloat(Ls) / 100 : parseFloat(Ls);
    const C = Cs.endsWith('%') ? (parseFloat(Cs) / 100) * 0.4 : parseFloat(Cs);
    const H = parseAngle(Hs);
    return oklchToRgba(L, C, H, parseAlpha(alphaS));
  }

  // color(space r g b) or color(space r g b / alpha)
  const colorFnMatch = colorFnRegex.exec(normalizedColor);
  if (colorFnMatch) {
    const [, space, rs, gs, bs, alphaS] = colorFnMatch;
    const rc = parseColorComponent(rs);
    const gc = parseColorComponent(gs);
    const bc = parseColorComponent(bs);
    return colorFnToRgba(space.toLowerCase(), rc, gc, bc, parseAlpha(alphaS));
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

// Modern space-separated rgb: rgb(255 0 0) or rgb(255 0 0 / 0.5)
// Also supports percentages: rgb(100% 0% 0% / 50%)
const rgbaModernRegex =
  /^rgba?\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+%?)\s*(?:\/\s*([\d.]+%?))?\s*\)$/i;
// Modern space-separated hsl: hsl(120 100% 50%) or hsl(120 100% 50% / 0.5)
const hslaModernRegex =
  /^hsla?\(\s*([\d.]+(?:deg|rad|grad|turn)?)\s+([\d.]+)%\s+([\d.]+)%\s*(?:\/\s*([\d.]+%?))?\s*\)$/i;
// hwb(H W B) or hwb(H W B / alpha)
const hwbRegex =
  /^hwb\(\s*([\d.]+(?:deg|rad|grad|turn)?)\s+([\d.]+)%\s+([\d.]+)%\s*(?:\/\s*([\d.]+%?))?\s*\)$/i;
// color(space r g b) or color(space r g b / alpha)
const colorFnRegex =
  /^color\(\s*([\w-]+)\s+([\d.e+-]+%?)\s+([\d.e+-]+%?)\s+([\d.e+-]+%?)\s*(?:\/\s*([\d.]+%?))?\s*\)$/i;

// CSS Color Level 4: space-separated values with optional / alpha
// lab(L a b) or lab(L a b / alpha)
const labRegex =
  /^lab\(\s*([\d.]+%?)\s+([\d.e+-]+%?)\s+([\d.e+-]+%?)\s*(?:\/\s*([\d.]+%?))?\s*\)$/i;
// lch(L C H) or lch(L C H / alpha)
const lchRegex =
  /^lch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.e+-]+(?:deg|rad|grad|turn)?)\s*(?:\/\s*([\d.]+%?))?\s*\)$/i;
// oklab(L a b) or oklab(L a b / alpha)
const oklabRegex =
  /^oklab\(\s*([\d.]+%?)\s+([\d.e+-]+%?)\s+([\d.e+-]+%?)\s*(?:\/\s*([\d.]+%?))?\s*\)$/i;
// oklch(L C H) or oklch(L C H / alpha)
const oklchRegex =
  /^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.e+-]+(?:deg|rad|grad|turn)?)\s*(?:\/\s*([\d.]+%?))?\s*\)$/i;

// Parse angle value supporting deg, rad, grad, turn units
function parseAngle(value: string): number {
  const num = parseFloat(value);
  if (value.endsWith('rad')) return (num * 180) / Math.PI;
  if (value.endsWith('grad')) return (num * 360) / 400;
  if (value.endsWith('turn')) return num * 360;
  return num; // deg or unitless
}

// Parse alpha: percentage or number, default 1
function parseAlpha(value: string | undefined): number {
  if (value === undefined || value === '') return 1;
  if (value.endsWith('%')) return parseFloat(value) / 100;
  return parseFloat(value);
}

// Parse rgb component: number (0-255) or percentage (0%-100%)
function parseRgbComponent(value: string): number {
  if (value.endsWith('%')) return Math.round((parseFloat(value) / 100) * 255);
  return parseInt(value, 10);
}

// Parse color() component: number or percentage (maps to 0-1 range)
function parseColorComponent(value: string): number {
  if (value.endsWith('%')) return parseFloat(value) / 100;
  return parseFloat(value);
}

// sRGB gamma → sRGB linear (degamma)
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

// sRGB linear → sRGB gamma (inverse of the function in getLuminance)
function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

// Matrix-vector multiply for 3x3 (flat array)
function mul3(
  m: [number, number, number, number, number, number, number, number, number],
  v: [number, number, number]
): [number, number, number] {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}

// LMS → linear sRGB combined matrix (LMStoXYZ_D65 * XYZ_D65_to_linearSRGB)
// prettier-ignore
const LMS_TO_SRGB: [number, number, number, number, number, number, number, number, number] = [
   4.0767416621, -3.3077115913,  0.2309699292,
  -1.2684380046,  2.6097574011, -0.3413193965,
  -0.0041960863, -0.7034186147,  1.7076147010
];

// linear sRGB → LMS combined matrix (inverse of above)
// prettier-ignore
const SRGB_TO_LMS: [number, number, number, number, number, number, number, number, number] = [
  0.4122214708, 0.5363325363, 0.0514459929,
  0.2119034982, 0.6806995451, 0.1073969566,
  0.0883024619, 0.2817188376, 0.6299787005
];

// OKLab → LMS (cube root domain)
function oklabToLMSg(L: number, a: number, b: number): [number, number, number] {
  return [
    L + 0.3963377774 * a + 0.2158037573 * b,
    L - 0.1055613458 * a - 0.0638541728 * b,
    L - 0.0894841775 * a - 1.2914855480 * b,
  ];
}

// OKLab → linear sRGB
function oklabToLinearRgb(L: number, a: number, b: number): [number, number, number] {
  const [lg, mg, sg] = oklabToLMSg(L, a, b);
  return mul3(LMS_TO_SRGB, [lg * lg * lg, mg * mg * mg, sg * sg * sg]);
}

// linear sRGB → OKLab
function linearRgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const [l, m, s] = mul3(SRGB_TO_LMS, [r, g, b]);
  const lg = Math.cbrt(l), mg = Math.cbrt(m), sg = Math.cbrt(s);
  return [
    0.2104542553 * lg + 0.7936177850 * mg - 0.0040720468 * sg,
    1.9779984951 * lg - 2.4285922050 * mg + 0.4505937099 * sg,
    0.0259040371 * lg + 0.7827717662 * mg - 0.8086757660 * sg,
  ];
}

// Check if linear sRGB values are in gamut (within [0, 1] with small tolerance)
function isInGamut(rgb: [number, number, number]): boolean {
  const e = -0.0001;
  return rgb[0] >= e && rgb[0] <= 1.0001 && rgb[1] >= e && rgb[1] <= 1.0001 && rgb[2] >= e && rgb[2] <= 1.0001;
}

// Clamp linear sRGB to [0, 1] and convert to gamma sRGB [0, 255]
function linearToRgbChannel(c: number): number {
  return Math.round(Math.min(255, Math.max(0, linearToSrgb(Math.min(1, Math.max(0, c))) * 255)));
}

// DeltaEOK: Euclidean distance in OKLab space
function deltaEOK(
  lab1: [number, number, number],
  lab2: [number, number, number]
): number {
  return Math.sqrt(
    (lab1[0] - lab2[0]) ** 2 +
    (lab1[1] - lab2[1]) ** 2 +
    (lab1[2] - lab2[2]) ** 2
  );
}

// CSS Gamut Mapping Algorithm (per CSS Color Level 4 spec)
// Binary search on OKLCH chroma to find the largest in-gamut chroma
// that preserves lightness and hue.
function gamutMapOklch(
  L: number,
  C: number,
  H: number
): [number, number, number] {
  const JND = 0.02;
  const EPSILON = 0.0001;

  // If lightness is at extremes, return black or white
  if (L >= 1) return [1, 1, 1];
  if (L <= 0) return [0, 0, 0];

  // If already in gamut, convert directly
  const hRad = (H * Math.PI) / 180;
  const cosH = Math.cos(hRad);
  const sinH = Math.sin(hRad);

  let rgb = oklabToLinearRgb(L, C * cosH, C * sinH);
  if (isInGamut(rgb)) return rgb;

  // Binary search: reduce chroma until in gamut
  let lo = 0;
  let hi = C;
  let loInGamut = true;

  // Clip and check initial distance
  let clipped: [number, number, number] = [
    Math.min(1, Math.max(0, rgb[0])),
    Math.min(1, Math.max(0, rgb[1])),
    Math.min(1, Math.max(0, rgb[2])),
  ];
  let clippedLab = linearRgbToOklab(clipped[0], clipped[1], clipped[2]);
  let currentLab: [number, number, number] = [L, C * cosH, C * sinH];

  if (deltaEOK(clippedLab, currentLab) < JND) {
    return clipped;
  }

  while (hi - lo > EPSILON) {
    const mid = (lo + hi) / 2;
    currentLab = [L, mid * cosH, mid * sinH];
    rgb = oklabToLinearRgb(currentLab[0], currentLab[1], currentLab[2]);

    if (loInGamut && isInGamut(rgb)) {
      lo = mid;
      continue;
    }

    clipped = [
      Math.min(1, Math.max(0, rgb[0])),
      Math.min(1, Math.max(0, rgb[1])),
      Math.min(1, Math.max(0, rgb[2])),
    ];
    clippedLab = linearRgbToOklab(clipped[0], clipped[1], clipped[2]);
    const dE = deltaEOK(clippedLab, currentLab);

    if (dE < JND) {
      if (JND - dE < EPSILON) break;
      loInGamut = false;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return clipped;
}

// Convert gamut-mapped linear sRGB to final RGBA output
function gamutMapToRgba(
  L: number,
  C: number,
  H: number,
  alpha: number
): [number, number, number, number] {
  const [lr, lg, lb] = gamutMapOklch(L, C, H);
  return [linearToRgbChannel(lr), linearToRgbChannel(lg), linearToRgbChannel(lb), alpha];
}

// CIE Lab → XYZ-D50
const labKappa = 24389 / 27; // 29^3/3^3
// D50 white point
const D50 = [0.3457 / 0.3585, 1.0, (1.0 - 0.3457 - 0.3585) / 0.3585] as const;

// CIE Lab → OKLab (via XYZ-D50 → XYZ-D65 → linear sRGB → OKLab)
function labToOklab(
  L: number,
  a: number,
  b: number
): [number, number, number] {
  // Lab → XYZ-D50
  const f1 = (L + 16) / 116;
  const f0 = a / 500 + f1;
  const f2 = f1 - b / 200;

  const x =
    (f0 > 24 / 116 ? f0 * f0 * f0 : (116 * f0 - 16) / labKappa) * D50[0];
  const y = L > 8 ? Math.pow((L + 16) / 116, 3) : L / labKappa;
  const z =
    (f2 > 24 / 116 ? f2 * f2 * f2 : (116 * f2 - 16) / labKappa) * D50[2];

  // XYZ-D50 → XYZ-D65 (Bradford chromatic adaptation)
  // prettier-ignore
  const [xd65, yd65, zd65] = mul3([
    0.9554734527042182, -0.023098536874261423, 0.0632593086610217,
   -0.028369706963208136, 1.0099954580106629, 0.021041398966943008,
    0.012314001688319899, -0.020507696433477912, 1.3303659366080753
  ], [x, y, z]);

  // XYZ-D65 → linear sRGB → OKLab
  // prettier-ignore
  const [lr, lg, lb] = mul3([
     3.2409699419045226, -1.5373831775700940, -0.4986107602930034,
    -0.9692436362808796,  1.8759675015077202,  0.0415550574071756,
     0.0556300796969937, -0.2039769588889765,  1.0569715142428786
  ], [xd65, yd65, zd65]);

  return linearRgbToOklab(lr, lg, lb);
}

// Convert Lab/LCH to gamut-mapped RGBA by going through OKLab → OKLCH
function labToRgba(
  L: number,
  a: number,
  b: number,
  alpha: number
): [number, number, number, number] {
  const [okL, okA, okB] = labToOklab(L, a, b);
  const C = Math.sqrt(okA * okA + okB * okB);
  const H = C < 0.0001 ? 0 : ((Math.atan2(okB, okA) * 180) / Math.PI + 360) % 360;
  return gamutMapToRgba(okL, C, H, alpha);
}

function oklabToRgba(
  L: number,
  a: number,
  b: number,
  alpha: number
): [number, number, number, number] {
  const C = Math.sqrt(a * a + b * b);
  const H = C < 0.0001 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return gamutMapToRgba(L, C, H, alpha);
}

function lchToRgba(
  L: number,
  C: number,
  H: number,
  alpha: number
): [number, number, number, number] {
  const hRad = (H * Math.PI) / 180;
  return labToRgba(L, C * Math.cos(hRad), C * Math.sin(hRad), alpha);
}

function oklchToRgba(
  L: number,
  C: number,
  H: number,
  alpha: number
): [number, number, number, number] {
  return gamutMapToRgba(L, C, H, alpha);
}

// HWB → RGB (https://www.w3.org/TR/css-color-4/#hwb-to-rgb)
function hwbToRgb(
  hue: number,
  white: number,
  black: number
): [number, number, number] {
  // If w + b >= 1, it's achromatic
  if (white + black >= 1) {
    const gray = Math.round((white / (white + black)) * 255);
    return [gray, gray, gray];
  }
  // Start with pure hue from HSL (s=100%, l=50%)
  const rgb = hslToRgb(hue, 100, 50);
  return rgb.map((c) => Math.round(c / 255 * (1 - white - black) * 255 + white * 255)) as [number, number, number];
}

// XYZ-D65 → linear sRGB matrix
// prettier-ignore
const XYZ_D65_TO_SRGB: [number, number, number, number, number, number, number, number, number] = [
   3.2409699419045226, -1.5373831775700940, -0.4986107602930034,
  -0.9692436362808796,  1.8759675015077202,  0.0415550574071756,
   0.0556300796969937, -0.2039769588889765,  1.0569715142428786
];

// Bradford D50 → D65 chromatic adaptation
// prettier-ignore
const D50_TO_D65: [number, number, number, number, number, number, number, number, number] = [
  0.9554734527042182, -0.023098536874261423, 0.0632593086610217,
 -0.028369706963208136, 1.0099954580106629, 0.021041398966943008,
  0.012314001688319899, -0.020507696433477912, 1.3303659366080753
];

// Color space definitions for color() function
// Each space has: toXYZ matrix (to XYZ-D65), degamma function, and white point
type M9 = [number, number, number, number, number, number, number, number, number];
type ColorSpaceDef = {
  toXYZ: M9;
  degamma: (c: number) => number;
  d50?: boolean; // true if matrices are relative to D50 (needs Bradford)
};

const identity = (c: number) => c;
const a98Degamma = (c: number) => Math.pow(Math.abs(c), 563 / 256) * Math.sign(c);
const rec2020Degamma = (c: number) => Math.pow(Math.abs(c), 2.4) * Math.sign(c);
const prophotoEt = 1 / 512;
const prophotoDegamma = (c: number) => {
  const abs = Math.abs(c);
  return abs < 16 * prophotoEt ? c / 16 : Math.sign(c) * Math.pow(abs, 1.8);
};

// prettier-ignore
const COLOR_SPACES: { [key: string]: ColorSpaceDef } = {
  'srgb': {
    toXYZ: [
      0.41239079926595934, 0.357584339383878,   0.1804807884018343,
      0.21263900587151027, 0.715168678767756,   0.07219231536073371,
      0.01933081871559182, 0.11919477979462598, 0.9505321522496607
    ],
    degamma: srgbToLinear,
  },
  'srgb-linear': {
    toXYZ: [
      0.41239079926595934, 0.357584339383878,   0.1804807884018343,
      0.21263900587151027, 0.715168678767756,   0.07219231536073371,
      0.01933081871559182, 0.11919477979462598, 0.9505321522496607
    ],
    degamma: identity,
  },
  'display-p3': {
    toXYZ: [
      0.4865709486482162,  0.26566769316909306, 0.1982172852343625,
      0.2289745640697488,  0.6917385218365064,  0.079286914093745,
      0.0000000000000000,  0.04511338185890264, 1.043944368900976
    ],
    degamma: srgbToLinear, // same gamma as sRGB
  },
  'a98-rgb': {
    toXYZ: [
      0.5766690429101305,  0.1855582379065463,  0.1882286462349947,
      0.29734497525053605, 0.6273635662554661,  0.07529145849399788,
      0.02703136138641234, 0.07068885253582723, 0.9913375368376388
    ],
    degamma: a98Degamma,
  },
  'rec2020': {
    toXYZ: [
      0.6369580483012914,  0.14461690358620832, 0.1688809751641721,
      0.2627002120112671,  0.6779980715188708,  0.05930171646986196,
      0.000000000000000,   0.028072693049087428,1.060985057710791
    ],
    degamma: rec2020Degamma,
  },
  'prophoto-rgb': {
    toXYZ: [
      0.79776664490064230, 0.13518129740053308, 0.03134773412839220,
      0.28807482881940130, 0.71183523424187300, 0.00008993693872564,
      0.00000000000000000, 0.00000000000000000, 0.82510460251046020
    ],
    degamma: prophotoDegamma,
    d50: true, // ProPhoto uses D50
  },
};

// Convert color() input to linear sRGB, then gamut map to RGBA
function colorFnToRgba(
  space: string,
  r: number,
  g: number,
  b: number,
  alpha: number
): [number, number, number, number] {
  // xyz-d65 and xyz are direct XYZ → linear sRGB
  if (space === 'xyz-d65' || space === 'xyz') {
    const lin = mul3(XYZ_D65_TO_SRGB, [r, g, b]);
    return linearToGamutMappedRgba(lin, alpha);
  }

  // xyz-d50 needs Bradford adaptation first
  if (space === 'xyz-d50') {
    const d65 = mul3(D50_TO_D65, [r, g, b]);
    const lin = mul3(XYZ_D65_TO_SRGB, d65);
    return linearToGamutMappedRgba(lin, alpha);
  }

  const def = COLOR_SPACES[space];
  if (!def) throw new ColorError(`color(${space} ...)`);

  // Degamma the input values
  const lr = def.degamma(r);
  const lg = def.degamma(g);
  const lb = def.degamma(b);

  // Convert to XYZ (D65 or D50 depending on space)
  let xyz = mul3(def.toXYZ, [lr, lg, lb]);

  // If the space uses D50, adapt to D65
  if (def.d50) {
    xyz = mul3(D50_TO_D65, xyz);
  }

  // XYZ-D65 → linear sRGB
  const lin = mul3(XYZ_D65_TO_SRGB, xyz);
  return linearToGamutMappedRgba(lin, alpha);
}

// Convert linear sRGB to gamut-mapped RGBA via OKLCH
function linearToGamutMappedRgba(
  lin: [number, number, number],
  alpha: number
): [number, number, number, number] {
  // If already in gamut, just convert directly (fast path)
  if (isInGamut(lin)) {
    return [
      linearToRgbChannel(lin[0]),
      linearToRgbChannel(lin[1]),
      linearToRgbChannel(lin[2]),
      alpha,
    ];
  }
  // Out of gamut — convert to OKLab → OKLCH and gamut map
  const [okL, okA, okB] = linearRgbToOklab(lin[0], lin[1], lin[2]);
  const C = Math.sqrt(okA * okA + okB * okB);
  const H = C < 0.0001 ? 0 : ((Math.atan2(okB, okA) * 180) / Math.PI + 360) % 360;
  return gamutMapToRgba(okL, C, H, alpha);
}

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
