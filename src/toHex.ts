import padStart from 'string.prototype.padstart';
import parseToRgba from './parseToRgba';
import guard from './guard';

/**
 * Takes in any color and returns it as a hex code.
 */
function toHex(color: string): string {
  const [r, g, b, a] = parseToRgba(color);
  const hex = (x: number) => padStart(guard(0, 255, x).toString(16), 2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}${a < 1 ? hex(Math.round(a * 255)) : ''}`;
}

export default toHex;
