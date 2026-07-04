import parseToHsla from './parseToHsla';
import hsla from './hsla';

/**
 * Converts a color to an `hsla` color string.
 *
 * ```js
 * toHsla('peachpuff'); // 'hsla(28, 100%, 86%, 1)'
 * ```
 *
 * @param color The input color.
 * @returns An `hsla` color string.
 */
function toHsla(color: string): string {
  return hsla(...parseToHsla(color));
}

export default toHsla;
