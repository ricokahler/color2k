import parseToHsla from './parseToHsla';
import hsla from './hsla';

/**
 * Desaturates a color by subtracting from the saturation channel in HSL space.
 *
 * ```js
 * desaturate('red', 0.5); // 'hsla(0, 50%, 50%, 1)'
 * ```
 *
 * @param color The input color.
 * @param amount The amount to desaturate, given as a decimal between 0 and 1.
 * @returns The desaturated color as an `hsla` string.
 */
function desaturate(color: string, amount: number): string {
  const [h, s, l, a] = parseToHsla(color);
  return hsla(h, s - amount, l, a);
}

export default desaturate;
