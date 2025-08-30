import desaturate from './desaturate';

/**
 * Saturates a color by converting it to `hsl` and increasing the saturation
 * amount. Equivalent to `desaturate(color, -amount)`.
 *
 * @param color The input color
 * @param amount The amount to darken, given as a decimal between 0 and 1
 */
function saturate(color: string, amount: number): string {
  return desaturate(color, -amount);
}

export default saturate;
