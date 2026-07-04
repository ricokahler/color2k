import transparentize from './transparentize';

/**
 * Makes a color more opaque by increasing the alpha channel.
 *
 * This is equivalent to `transparentize(color, -amount)`.
 *
 * ```js
 * opacify('rgba(255, 255, 255, 0.5)', 0.1); // 'rgba(255, 255, 255, 0.6)'
 * ```
 *
 * @param color The input color.
 * @param amount The amount to increase opacity by, given as a decimal between 0 and 1.
 * @returns The more opaque color as an `rgba` string.
 */
function opacify(color: string, amount: number): string {
  return transparentize(color, -amount);
}

export default opacify;
