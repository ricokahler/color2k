import parseToHsla from './parseToHsla';
import hsla from './hsla';

/**
 * Rotates a color's hue by the given number of degrees and returns the result
 * as an `hsla` string.
 *
 * A hue past 360 wraps around the color wheel. A hue below 0 does not: when
 * the color's own hue plus `degrees` is negative, the result has a negative
 * hue. `adjustHue('red', -120)` returns `hsla(-120, 100%, 50%, 1)`, which
 * browsers understand but color2k cannot parse again. `adjustHue('blue', -120)`
 * is fine, because blue's hue is 240.
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
