// taken from:
// https://github.com/styled-components/polished/blob/6f72ff07eed0bb63ada17369fde4986c9389e5f9/src/color/readableColor.js
import getLuminance from './getLuminance';

/**
 * Returns black or white for best contrast depending on the luminosity of the given color.
 */
export default function readableColor(color: string): string {
  return getLuminance(color) > 0.179 ? '#000' : '#fff';
}
