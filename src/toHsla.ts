import parseToHsla from './parseToHsla';
import hsla from './hsla';

/**
 * Takes in any color and returns it as a hsla string.
 */
function toHsla(color: string): string {
  return hsla(...parseToHsla(color));
}

export default toHsla;
