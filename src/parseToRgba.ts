import nameToHex from './nameToHex';
import guard from './guard';
import ColorError from './ColorError';

let r = (str: string, amount: number) =>
  Array.from(Array(amount))
    .map(() => str)
    .join('');

let h1 = new RegExp(`^#${r('([a-f0-9])', 3)}([a-f0-9])?$`, 'i');
let h2 = new RegExp(`^#${r('([a-f0-9]{2})', 3)}([a-f0-9]{2})?$`, 'i');
let r1 = new RegExp(
  `^rgba?\\(\\s*(\\d+)\\s*${r(
    ',\\s*(\\d+)\\s*',
    2
  )}(?:,\\s*([\\d.]+))?\\s*\\)$`,
  'i'
);
let hs = /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)$/i;
let a = /^[a-z]+$/i;

let c = (color: number): number => {
  return Math.round(color * 255);
};

/**
 *
 */
let hr = (
  hue: number,
  saturation: number,
  lightness: number
): [number, number, number] => {
  let l = lightness / 100;
  if (saturation === 0) {
    // achromatic
    return [l, l, l].map(c) as [number, number, number];
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

  return [finalRed, finalGreen, finalBlue].map(c) as [number, number, number];
};

/**
 * Returns an RgbColor or RgbaColor object. This utility function is only useful
 * if want to extract a color component. With the color util `toColorString` you
 * can convert a RgbColor or RgbaColor object back to a string.
 */
let p = (color: string): [number, number, number, number] => {
  if (typeof color !== 'string') throw new ColorError(color);
  if (color.trim().toLowerCase() === 'transparent') return [0, 0, 0, 0];

  const normalizedColor = a.test(color) ? nameToHex(color.trim()) : color;

  const reducedHexMatch = h1.exec(normalizedColor);
  if (reducedHexMatch) {
    const arr = Array.from(reducedHexMatch).slice(1);
    return [
      ...arr.slice(0, 3).map((x) => parseInt(r(x, 2), 16)),
      parseInt(r(arr[3] || 'f', 2), 16) / 255,
    ] as [number, number, number, number];
  }

  const hexMatch = h2.exec(normalizedColor);
  if (hexMatch) {
    const arr = Array.from(hexMatch).slice(1);
    return [
      ...arr.slice(0, 3).map((x) => parseInt(x, 16)),
      parseInt(arr[3] || 'ff', 16) / 255,
    ] as [number, number, number, number];
  }

  const rgbaMatch = r1.exec(normalizedColor);
  if (rgbaMatch) {
    const arr = Array.from(rgbaMatch).slice(1);
    return [
      ...arr.slice(0, 3).map((x) => parseInt(x, 10)),
      parseFloat(arr[3] || '1'),
    ] as [number, number, number, number];
  }

  const hslaMatch = hs.exec(normalizedColor);
  if (hslaMatch) {
    const [h, s, l, a] = Array.from(hslaMatch).slice(1).map(parseFloat);
    if (guard(0, 100, s) !== s) throw new ColorError(color);
    if (guard(0, 100, l) !== l) throw new ColorError(color);
    return [...hr(h, s, l), a || 1] as [number, number, number, number];
  }

  throw new ColorError(color);
};

export default p;
