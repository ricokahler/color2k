import parseToRgba from './parseToRgba';
import rgba from './rgba';

/**
 * Makes a color more transparent by decreasing the alpha channel.
 *
 * ```js
 * transparentize('white', 0.1); // 'rgba(255, 255, 255, 0.9)'
 * ```
 *
 * @param color The input color.
 * @param amount The amount to increase transparency by, given as a decimal between 0 and 1.
 * @returns The more transparent color as an `rgba` string.
 */
function transparentize(color: string, amount: number): string {
  const [r, g, b, a] = parseToRgba(color);
  return rgba(r, g, b, a - amount);
}

export default transparentize;
