/**
 * A simple guard function:
 *
 * ```js
 * Math.min(Math.max(low, value), high)
 * ```
 */
function guard(low: number, high: number, value: number): number {
  return Math.min(Math.max(low, value), high);
}

export default guard;
