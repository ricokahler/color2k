import parseToRgba from './parseToRgba';
import rgba from './rgba';

/**
 * Takes in a color and makes it more transparent by convert to `rgba` and
 * decreasing the amount in the alpha channel.
 *
 * @param amount The amount to increase the transparency by, given as a decimal between 0 and 1
 */
function transparentize(color: string, amount: number): string {
  const [r, g, b, a] = parseToRgba(color);
  return rgba(r, g, b, a - amount);
}

export default transparentize;
