import parseToHsla from './parseToHsla';
import hsla from './hsla';

/**
 * Rotates a color's hue by the given number of degrees and returns the result
 * as an `hsla` string. Hue values wrap around the 0 to 360 degree color wheel.
 *
 * ```js
 * adjustHue('red', 180); // 'hsla(180, 100%, 50%, 1)'
 * ```
 *
 * @param color The input color.
 * @param degrees The number of degrees to rotate the hue.
 * @returns The adjusted color as an `hsla` string.
 */
function adjustHue(color: string, degrees: number): string {
  const [h, s, l, a] = parseToHsla(color);
  return hsla(h + degrees, s, l, a);
}

export default adjustHue;
