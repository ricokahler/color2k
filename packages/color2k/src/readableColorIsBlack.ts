import getLuminance from './getLuminance';

/**
 * An alternative function to `readableColor`. Returns whether or not the 
 * readable color (i.e. the color to be place on top the input color) should be
 * black.
 */
function readableColorIsBlack(color: string): boolean {
  return getLuminance(color) > 0.179;
}

export default readableColorIsBlack;
