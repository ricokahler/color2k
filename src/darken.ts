import parseToHsla from './parseToHsla';
import hsla from './hsla';

/**
 * Darkens a color by subtracting from the lightness channel in HSL space.
 *
 * ```js
 * darken('white', 0.1); // 'hsla(0, 0%, 90%, 1)'
 * ```
 *
 * @param color The input color.
 * @param amount The amount to darken, given as a decimal between 0 and 1.
 * @returns The darkened color as an `hsla` string.
 */
function darken(color: string, amount: number): string {
  const [hue, saturation, lightness, alpha] = parseToHsla(color);
  return hsla(hue, saturation, lightness - amount, alpha);
}

export default darken;
