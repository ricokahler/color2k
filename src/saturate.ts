import desaturate from './desaturate';

/**
 * Saturates a color by adding to the saturation channel in HSL space.
 *
 * This is equivalent to `desaturate(color, -amount)`.
 *
 * ```js
 * saturate('hsl(0, 50%, 50%)', 0.1); // 'hsla(0, 60%, 50%, 1)'
 * ```
 *
 * @param color The input color.
 * @param amount The amount to saturate, given as a decimal between 0 and 1.
 * @returns The saturated color as an `hsla` string.
 */
function saturate(color: string, amount: number): string {
  return desaturate(color, -amount);
}

export default saturate;
