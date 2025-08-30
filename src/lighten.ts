import darken from './darken';
/**
 * Lightens a color by a given amount. Equivalent to `darken(color, -amount)`.
 *
 * @param color The input color
 * @param amount The amount to darken, given as a decimal between 0 and 1
 */
function lighten(color: string, amount: number): string {
  return darken(color, -amount);
}

export default lighten;
