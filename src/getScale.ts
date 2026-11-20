import mix from './mix';
import guard from './guard';

/**
 * Returns a scale function that interpolates through a list of colors.
 *
 * Pass at least two colors. With fewer there is nothing to interpolate
 * between, and the scale has no colors to return.
 *
 * The returned function accepts a decimal between 0 and 1 and returns the color
 * at that percentage in the scale.
 *
 * ```js
 * const scale = getScale('red', 'yellow', 'green');
 * console.log(scale(0)); // rgba(255, 0, 0, 1)
 * console.log(scale(0.5)); // rgba(255, 255, 0, 1)
 * console.log(scale(1)); // rgba(0, 128, 0, 1)
 * ```
 *
 * With a single color, the scale always returns that color.
 *
 * If you'd like to limit the domain and range like chroma-js, we recommend
 * wrapping scale again.
 *
 * ```js
 * const _scale = getScale('red', 'yellow', 'green');
 * const scale = x => _scale(x / 100);
 *
 * console.log(scale(0)); // rgba(255, 0, 0, 1)
 * console.log(scale(50)); // rgba(255, 255, 0, 1)
 * console.log(scale(100)); // rgba(0, 128, 0, 1)
 * ```
 *
 * @param colors The colors to interpolate through.
 * @returns A function that maps a decimal percentage to an `rgba` color.
 */
function getScale(...colors: string[]): (n: number) => string {
  return (n) => {
    const lastIndex = colors.length - 1;
    const lowIndex = guard(0, lastIndex, Math.floor(n * lastIndex));
    const highIndex = guard(0, lastIndex, Math.ceil(n * lastIndex));

    const color1 = colors[lowIndex];
    const color2 = colors[highIndex];

    const unit = 1 / lastIndex;
    // a single color has no second color to move toward
    const weight = lastIndex ? (n - unit * lowIndex) / unit : 0;

    return mix(color1, color2, weight);
  };
}

export default getScale;
