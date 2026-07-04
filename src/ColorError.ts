/**
 * Error thrown when color2k cannot parse an input color.
 *
 * ```js
 * new ColorError('nope').message; // 'Failed to parse color: "nope"'
 * ```
 *
 * @param color The color value that failed to parse.
 */
class ColorError extends Error {
  constructor(color: string) {
    super(`Failed to parse color: "${color}"`);
  }
}

export default ColorError;
