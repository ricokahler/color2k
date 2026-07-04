import darken from './darken';
/**
 * Lightens a color by adding to the lightness channel in HSL space.
 *
 * This is equivalent to `darken(color, -amount)`.
 *
 * ```js
 * lighten('black', 0.1); // 'hsla(0, 0%, 10%, 1)'
 * ```
 *
 * @param color The input color.
 * @param amount The amount to lighten, given as a decimal between 0 and 1.
 * @returns The lightened color as an `hsla` string.
 */
function lighten(color: string, amount: number): string {
  return darken(color, -amount);
}

export default lighten;
