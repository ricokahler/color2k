import readableColorIsBlack from './readableColorIsBlack';

/**
 * Returns black or white for best contrast depending on the luminosity of the
 * given color.
 */
function readableColor(color: string): string {
  return readableColorIsBlack(color) ? '#000' : '#fff';
}

export default readableColor;
