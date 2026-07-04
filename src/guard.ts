/**
 * Clamps a number between a lower and upper bound.
 *
 * ```js
 * guard(0, 1, 2); // 1
 * ```
 *
 * @param low The lower bound.
 * @param high The upper bound.
 * @param value The number to clamp.
 * @returns The clamped number.
 */
function guard(low: number, high: number, value: number): number {
  return Math.min(Math.max(low, value), high);
}

export default guard;
