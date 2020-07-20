import parseToHsla from './parseToHsla';
import hsla from './hsla';

/**
 * Desaturates the input color by the given amount via subtracting from the `s`
 * in `hsla`.
 *
 * @param amount amount to desaturate, given as a decimal between 0 and 1
 */
function desaturate(color: string, amount: number): string {
  const [h, s, l, a] = parseToHsla(color);
  return hsla(h, s - amount, l, a);
}

export default desaturate;
