import parseToHsla from './parseToHsla';
import hsla from './hsla';

/**
 * Adjusts the current hue of the color by the given degrees. Wraps around 
 *
 * @param color input color
 * @param degrees degrees to adjust the input color, accepts degree integers
 * (0 - 360) and wraps around on overflow
 */
function adjustHue(color: string, degrees: number) {
  const [h, s, l, a] = parseToHsla(color);
  return hsla(h + degrees, s, l, a);
}

export default adjustHue;
