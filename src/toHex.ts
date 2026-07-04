import parseToRgba from './parseToRgba';
import guard from './guard';

/**
 * Converts a color to a hex color string.
 *
 * Includes an alpha channel when the input color is not fully opaque.
 *
 * ```js
 * toHex('palevioletred'); // '#db7093'
 * ```
 *
 * @param color The input color.
 * @returns A hex color string.
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
