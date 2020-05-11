import mix from './mix';
import guard from './guard';

/**
 * Given a series colors, this function will return a `scale(x)` function that
 * accepts an percentage as a decimal between 0, 1 and returns the color that
 * in the scale.
 *
 * ```js
 * const scale = getScale('red', 'yellow', 'green');
 * console.log(scale(0)); // rgba(255, 0, 0, 1)
 * console.log(scale(0.5)); // rgba(255, 255, 0, 1)
 * console.log(scale(1)); // rgba(0, 128, 0, 1)
 * ```
 *
 * If you'd like to limit the domain and range like chroma-js, we recommend
 * wrapping scale once more
 *
 * ```js
 * const _scale = getScale('red', 'yellow', 'green');
 * const scale = x => _scale(x / 100);
 *
 * console.log(scale(0)); // rgba(255, 0, 0, 1)
 * console.log(scale(50)); // rgba(255, 255, 0, 1)
 * console.log(scale(100)); // rgba(0, 128, 0, 1)
 * ```
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
