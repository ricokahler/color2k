import guard from './guard';

/**
 * Takes in rgba parts and returns an rgba string
 *
 * @param red The amount of red in the red channel, given in a number between 0 and 255 inclusive
 * @param green The amount of green in the red channel, given in a number between 0 and 255 inclusive
 * @param blue The amount of blue in the red channel, given in a number between 0 and 255 inclusive
 * @param alpha Percentage of opacity, given as a decimal between 0 and 1
 */
function rgba(red: number, green: number, blue: number, alpha: number): string {
  return `rgba(${guard(0, 255, red).toFixed()}, ${guard(
    0,
    255,
    green
  ).toFixed()}, ${guard(0, 255, blue).toFixed()}, ${guard(0, 1, alpha)})`;
}

export default rgba;
