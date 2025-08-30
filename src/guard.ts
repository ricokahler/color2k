/**
 * Clamps a given value within the inclusive lower and upper bounds specified by `low` and `high`.
 *
 * ```js
 * Math.min(Math.max(low, value), high)
 * ```
 * 
 * @param low The lower bound
 * @param high The upper bound
 * @param value The value being clamped.
 */
function guard(low: number, high: number, value: number): number {
  return Math.min(Math.max(low, value), high);
}

export default guard;
