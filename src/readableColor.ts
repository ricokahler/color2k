import readableColorIsBlack from './readableColorIsBlack';

/**
 * Returns black or white, whichever has better contrast against the given
 * color.
 *
 * ```js
 * readableColor('white'); // '#000'
 * ```
 *
 * @param color The background color.
 * @returns `#000` or `#fff`.
 */
function readableColor(color: string): string {
  return readableColorIsBlack(color) ? '#000' : '#fff';
}

export default readableColor;
