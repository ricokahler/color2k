import adjustHue from './adjustHue';

/**
 * Rotates a color's hue by 180 degrees and returns the result as an `hsla`
 * string. This matches Sass's `complement`. Grays have no hue, so they come
 * back as the same gray.
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
