import parseToHsla from './parseToHsla';
import hsla from './hsla';

/**
 * Rotates a color's hue by the given number of degrees and returns the result
 * as an `hsla` string.
 *
 * A hue past 360 wraps around the color wheel. A hue below 0 is not wrapped:
 * `adjustHue('red', -120)` returns `hsla(-120, 100%, 50%, 1)`, which browsers
 * understand but color2k cannot parse again, so prefer positive degrees.
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
