import transparentize from './transparentize';

/**
 * Takes a color and un-transparentizes it. Equivalent to
 * `transparentize(color, -amount)`
 *
 * @param amount The amount to increase the opacity by, given as a decimal between 0 and 1
 */
function opacify(color: string, amount: number): string {
  return transparentize(color, -amount);
}

export default opacify;
