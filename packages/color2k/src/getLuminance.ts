import parseToRgba from '@color2k/parse-to-rgba';
// taken from:
// https://github.com/styled-components/polished/blob/0764c982551b487469043acb56281b0358b3107b/src/color/getLuminance.js

/**
 * Returns a number (float) representing the luminance of a color.
 */
function getLuminance(color: string): number {
  if (color === 'transparent') return 0;

  function f(x: number) {
    const channel = x / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  }

  const [r, g, b] = parseToRgba(color);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export default getLuminance;
