import mix from './mix';
import guard from './guard';

/**
 * Creates a color scale function that interpolates colors within a given set of
 * colors. This function accepts an array of color strings and returns a new
 * function `scale(x)` that, when called with a decimal number between 0 and 1,
 * returns the color at that specific percentage along the color scale. The
 * colors are mixed linearly between the provided colors based on the input
 * percentage.
 *
 * ```js
 * const scale = getScale('red', 'yellow', 'green');
 * console.log(scale(0)); // rgba(255, 0, 0, 1)
 * console.log(scale(0.5)); // rgba(255, 255, 0, 1)
 * console.log(scale(1)); // rgba(0, 128, 0, 1)
 * ```
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
 * @param colors An array of color strings used to define the stops along the scale.
 */
function getScale(...colors: string[]): (n: number) => string {
  return (n) => {
    const lastIndex = colors.length - 1;
    const lowIndex = guard(0, lastIndex, Math.floor(n * lastIndex));
    const highIndex = guard(0, lastIndex, Math.ceil(n * lastIndex));

    const color1 = colors[lowIndex];
    const color2 = colors[highIndex];

    const unit = 1 / lastIndex;
    const weight = (n - unit * lowIndex) / unit;

    return mix(color1, color2, weight);
  };
}

export default getScale;
