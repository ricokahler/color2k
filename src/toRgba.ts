import parseToRgba from './parseToRgba';
import rgba from './rgba';

/**
 * Converts a color to an `rgba` color string.
 *
 * ```js
 * toRgba('midnightblue'); // 'rgba(25, 25, 112, 1)'
 * ```
 *
 * @param color The input color.
 * @returns An `rgba` color string.
 */
function toRgba(color: string): string {
  return rgba(...parseToRgba(color));
}

export default toRgba;
