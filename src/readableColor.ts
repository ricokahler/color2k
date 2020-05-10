import readableColorIsBlack from './readableColorIsBlack';

/**
 * Returns black or white for best contrast depending on the luminosity of the given color.
 */
export default function readableColor(color: string): string {
  return readableColorIsBlack(color) ? '#000' : '#fff';
}

// @color2k/parse-to-rgba
// @color2k/node
// color2k

// color2k — a color lib with a sticker price of 2kBs