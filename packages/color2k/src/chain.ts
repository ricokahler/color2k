type ColorFn = (color: string, ...args: any[]) => string;
type ColorOperation = [ColorFn, ...any[]];

/**
 * Given a color and an array of operations, this function returns the combined
 * result.
 *
 * ```js
 * import { chain, darken, adjustHue, mix } from 'color2k';
 *
 * const result = chain('red', [
 *  [darken, 0.1],
 *  [adjustHue, 180],
 *  [mix, 'white', 0.3],
 * ]);
 *
 * console.log(result); // rgba(77, 219, 219, 1)
 * ```
 *
 * @param operations an array of color function, color arguments tuples
 */
function chain(color: string, operations: ColorOperation[]): string {
  return operations.reduce((color, [fn, ...args]) => fn(color, ...args), color);
}

export default chain;
