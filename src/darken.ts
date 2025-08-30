import parseToHsla from './parseToHsla';
import hsla from './hsla';

/**
 * Darkens using lightness. This is equivalent to subtracting the lightness
 * from the L in HSL.
 *
 * @param color The input color
 * @param amount The amount to darken, given as a decimal between 0 and 1
 */
function darken(color: string, amount: number): string {
  const [hue, saturation, lightness, alpha] = parseToHsla(color);
  return hsla(hue, saturation, lightness - amount, alpha);
}

export default darken;
