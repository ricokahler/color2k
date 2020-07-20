import guard from './guard';

/**
 * Takes in hsla parts and constructs an hsla string
 *
 * @param hue The color circle (from 0 to 360) - 0 (or 360) is red, 120 is green, 240 is blue
 * @param saturation Percentage of saturation, given as a decimal between 0 and 1
 * @param lightness Percentage of lightness, given as a decimal between 0 and 1
 * @param alpha Percentage of opacity, given as a decimal between 0 and 1
 */
function hsla(
  hue: number,
  saturation: number,
  lightness: number,
  alpha: number
): string {
  return `hsla(${hue % 360}, ${guard(
    0,
    100,
    saturation * 100
  ).toFixed()}%, ${guard(0, 100, lightness * 100).toFixed()}%, ${guard(
    0,
    1,
    alpha
  )})`;
}

export default hsla;
