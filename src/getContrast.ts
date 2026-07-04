// taken from:
// https://github.com/styled-components/polished/blob/0764c982551b487469043acb56281b0358b3107b/src/color/getContrast.js
import getLuminance from './getLuminance';

/**
 * Returns the contrast ratio between two colors based on the WCAG contrast
 * ratio formula.
 *
 * ```js
 * getContrast('#444', '#fff'); // 9.739769120526205
 * ```
 *
 * @param color1 The first color.
 * @param color2 The second color.
 * @returns The contrast ratio between the two colors.
 */
function getContrast(color1: string, color2: string): number {
  const luminance1 = getLuminance(color1);
  const luminance2 = getLuminance(color2);

  return luminance1 > luminance2
    ? (luminance1 + 0.05) / (luminance2 + 0.05)
    : (luminance2 + 0.05) / (luminance1 + 0.05);
}

export default getContrast;
