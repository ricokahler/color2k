import parseToRgba from './parseToRgba';
import guard from './guard';

/**
 * Takes in any color and returns it as a hex code.
 */
function toHex(color: string): string {
  const [r, g, b, a] = parseToRgba(color);

  let hex = (x: number) => {
    const h = guard(0, 255, x).toString(16);
    // NOTE: padStart could be used here but it breaks Node 6 compat
    // https://github.com/ricokahler/color2k/issues/351
    return h.length === 1 ? `0${h}` : h;
  };

  return `#${hex(r)}${hex(g)}${hex(b)}${a < 1 ? hex(Math.round(a * 255)) : ''}`;
}

export default toHex;
