import guard from './guard';

/**
 * Builds an `rgba` color string from red, green, blue, and alpha channel
 * values.
 *
 * ```js
 * rgba(255, 0, 0, 1); // 'rgba(255, 0, 0, 1)'
 * ```
 *
 * @param red The red channel value from 0 to 255.
 * @param green The green channel value from 0 to 255.
 * @param blue The blue channel value from 0 to 255.
 * @param alpha The opacity as a decimal between 0 and 1.
 * @returns An `rgba` color string.
 */
function rgba(red: number, green: number, blue: number, alpha: number): string {
  return `rgba(${guard(0, 255, red).toFixed()}, ${guard(
    0,
    255,
    green
  ).toFixed()}, ${guard(0, 255, blue).toFixed()}, ${parseFloat(
    guard(0, 1, alpha).toFixed(3)
  )})`;
}

export default rgba;
