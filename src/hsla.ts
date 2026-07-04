import guard from './guard';

/**
 * Builds an `hsla` color string from hue, saturation, lightness, and alpha
 * channel values.
 *
 * ```js
 * hsla(0, 1, 0.5, 1); // 'hsla(0, 100%, 50%, 1)'
 * ```
 *
 * @param hue The color wheel angle from 0 to 360.
 * @param saturation The saturation as a decimal between 0 and 1.
 * @param lightness The lightness as a decimal between 0 and 1.
 * @param alpha The opacity as a decimal between 0 and 1.
 * @returns An `hsla` color string.
 */
function hsla(
  hue: number,
  saturation: number,
  lightness: number,
  alpha: number
): string {
  return `hsla(${(hue % 360).toFixed()}, ${guard(
    0,
    100,
    saturation * 100
  ).toFixed()}%, ${guard(0, 100, lightness * 100).toFixed()}%, ${parseFloat(
    guard(0, 1, alpha).toFixed(3)
  )})`;
}

export default hsla;
