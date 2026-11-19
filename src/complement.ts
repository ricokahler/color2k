import adjustHue from './adjustHue';

/**
 * Rotates a color's hue by 180 degrees and returns the result as an `hsla`
 * string, like Sass's `complement`.
 *
 * Like `adjustHue`, the result is rounded to whole degrees and percents, so
 * each channel can be up to 5 away from Sass's exact result. Grays have no hue
 * and keep their color, but their channels can move by 1 from that rounding.
 *
 * ```js
 * complement('red'); // 'hsla(180, 100%, 50%, 1)'
 * ```
 *
 * @param color The input color.
 * @returns The complementary color as an `hsla` string.
 */
function complement(color: string): string {
  return adjustHue(color, 180);
}

export default complement;
