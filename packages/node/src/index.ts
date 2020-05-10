import parseToRgba from '@color2k/parse-to-rgba';
import hslToRgb from './hslToRgb';
import nameToHex from './nameToHex';

// import type { RgbColor, RgbaColor } from '../types/color';

// function parseToRgbaNode(color: string): [number, number, number, number] {
//   throw new parseToRgba.ColorError(color);
// }

const { ColorError } = parseToRgba;

const hexRegex = /^#[a-fA-F0-9]{6}$/;
const hexRgbaRegex = /^#[a-fA-F0-9]{8}$/;
const reducedHexRegex = /^#[a-fA-F0-9]{3}$/;
const reducedRgbaHexRegex = /^#[a-fA-F0-9]{4}$/;
const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
const rgbaRegex = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([-+]?[0-9]*[.]?[0-9]+)\s*\)$/i;
const hslRegex = /^hsl\(\s*(\d{0,3}[.]?[0-9]+)\s*,\s*(\d{1,3}[.]?[0-9]?)%\s*,\s*(\d{1,3}[.]?[0-9]?)%\s*\)$/i;
const hslaRegex = /^hsla\(\s*(\d{0,3}[.]?[0-9]+)\s*,\s*(\d{1,3}[.]?[0-9]?)%\s*,\s*(\d{1,3}[.]?[0-9]?)%\s*,\s*([-+]?[0-9]*[.]?[0-9]+)\s*\)$/i;

/**
 * Returns an RgbColor or RgbaColor object. This utility function is only useful
 * if want to extract a color component. With the color util `toColorString` you
 * can convert a RgbColor or RgbaColor object back to a string.
 */
function parseToRgbaNode(color: string): [number, number, number, number] {
  if (typeof color !== 'string') throw new ColorError(color);
  if (color.trim().toLowerCase() === 'transparent') return [0, 0, 0, 0];

  const normalizedColor = nameToHex(color);
  if (normalizedColor.match(hexRegex)) {
    const r = parseInt(`${normalizedColor[1]}${normalizedColor[2]}`, 16);
    const g = parseInt(`${normalizedColor[3]}${normalizedColor[4]}`, 16);
    const b = parseInt(`${normalizedColor[5]}${normalizedColor[6]}`, 16);
    return [r, g, b, 1];
  }

  if (normalizedColor.match(hexRgbaRegex)) {
    const r = parseInt(`${normalizedColor[1]}${normalizedColor[2]}`, 16);
    const g = parseInt(`${normalizedColor[3]}${normalizedColor[4]}`, 16);
    const b = parseInt(`${normalizedColor[5]}${normalizedColor[6]}`, 16);
    const a = parseInt(`${normalizedColor[7]}${normalizedColor[8]}`, 16) / 255;
    if (a === 0) return [0, 0, 0, 0];
    return [r, g, b, a];
  }

  if (normalizedColor.match(reducedHexRegex)) {
    const r = parseInt(`${normalizedColor[1]}${normalizedColor[1]}`, 16);
    const g = parseInt(`${normalizedColor[2]}${normalizedColor[2]}`, 16);
    const b = parseInt(`${normalizedColor[3]}${normalizedColor[3]}`, 16);
    return [r, g, b, 1];
  }

  if (normalizedColor.match(reducedRgbaHexRegex)) {
    const r = parseInt(`${normalizedColor[1]}${normalizedColor[1]}`, 16);
    const g = parseInt(`${normalizedColor[2]}${normalizedColor[2]}`, 16);
    const b = parseInt(`${normalizedColor[3]}${normalizedColor[3]}`, 16);
    const a = parseInt(`${normalizedColor[4]}${normalizedColor[4]}`, 16) / 255;
    if (a === 0) return [0, 0, 0, 0];
    return [r, g, b, a];
  }

  const rgbMatched = rgbRegex.exec(normalizedColor);
  if (rgbMatched) {
    const r = parseInt(`${rgbMatched[1]}`, 10);
    const g = parseInt(`${rgbMatched[2]}`, 10);
    const b = parseInt(`${rgbMatched[3]}`, 10);
    return [r, g, b, 1];
  }

  const rgbaMatched = rgbaRegex.exec(normalizedColor);
  if (rgbaMatched) {
    const r = parseInt(`${rgbaMatched[1]}`, 10);
    const g = parseInt(`${rgbaMatched[2]}`, 10);
    const b = parseInt(`${rgbaMatched[3]}`, 10);
    const a = parseFloat(`${rgbaMatched[4]}`);
    if (a === 0) return [0, 0, 0, 0];
    return [r, g, b, a];
  }

  const hslMatched = hslRegex.exec(normalizedColor);
  if (hslMatched) {
    const h = parseInt(`${hslMatched[1]}`, 10);
    const s = parseInt(`${hslMatched[2]}`, 10) / 100;
    const l = parseInt(`${hslMatched[3]}`, 10) / 100;
    const rgbColorString = `rgb(${hslToRgb(h, s, l)})`;
    const hslRgbMatched = rgbRegex.exec(rgbColorString);
    if (!hslRgbMatched) throw new ColorError(color);

    const r = parseInt(`${hslRgbMatched[1]}`, 10);
    const g = parseInt(`${hslRgbMatched[2]}`, 10);
    const b = parseInt(`${hslRgbMatched[3]}`, 10);
    return [r, g, b, 1];
  }

  const hslaMatched = hslaRegex.exec(normalizedColor);
  if (hslaMatched) {
    const h = parseInt(`${hslaMatched[1]}`, 10);
    const s = parseInt(`${hslaMatched[2]}`, 10) / 100;
    const l = parseInt(`${hslaMatched[3]}`, 10) / 100;
    const rgbColorString = `rgb(${hslToRgb(h, s, l)})`;
    const hslRgbMatched = rgbRegex.exec(rgbColorString);
    if (!hslRgbMatched) throw new ColorError(color);

    const r = parseInt(`${hslRgbMatched[1]}`, 10);
    const g = parseInt(`${hslRgbMatched[2]}`, 10);
    const b = parseInt(`${hslRgbMatched[3]}`, 10);
    const a = parseFloat(`${hslaMatched[4]}`);
    if (a === 0) return [0, 0, 0, 0];
    return [r, g, b, a];
  }

  throw new ColorError(color);
}

export default parseToRgbaNode;
