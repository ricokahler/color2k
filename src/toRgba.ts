import parseToRgba from './parseToRgba';
import rgba from './rgba';

/**
 * Takes in any color and returns it as an rgba string.
 *
 * @param color The input color
 */
function toRgba(color: string): string {
  return rgba(...parseToRgba(color));
}

export default toRgba;
