import parseToRgba from './parseToRgba';
import rgba from './rgba';
import guard from './guard';

/**
 * Inverts a color's red, green, and blue channels, keeping its alpha, and
 * returns the result as an `rgba` string. This matches Sass's `invert`.
 *
 * `weight` controls how far to go toward the inverse: `1` (the default) fully
 * inverts the color, `0` returns it unchanged, and `0.5` always gives gray.
 * Weights outside 0 to 1 are clamped to that range. A weight that is not a
 * finite number (`NaN` or `Infinity`) throws a `RangeError`.
 *
 * ```js
 * invert('red'); // 'rgba(0, 255, 255, 1)'
 * invert('#336699', 0.25); // 'rgba(89, 115, 140, 1)'
 * ```
 *
 * @param color The input color.
 * @param weight How much to invert, given as a decimal between 0 and 1.
 * @returns The inverted color as an `rgba` string.
 */
function invert(color: string, weight: number = 1): string {
  if (!isFinite(weight)) throw new RangeError('weight');
  const [red, green, blue, alpha] = parseToRgba(color);
  const amount = guard(0, 1, weight);
  // Same as `mix(color, inverse, weight)`: both colors share the same alpha.
  const channel = (value: number) => value + (255 - 2 * value) * amount;
  return rgba(channel(red), channel(green), channel(blue), alpha);
}

export default invert;
