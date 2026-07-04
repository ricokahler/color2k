import getContrast from './getContrast';

const guidelines = {
  decorative: 1.5,
  readable: 3,
  aa: 4.5,
  aaa: 7,
};

/**
 * Returns whether a color fails a contrast threshold against a background.
 *
 * The supported standards are `decorative`, `readable`, `aa`, and `aaa`.
 *
 * ```js
 * hasBadContrast('red', 'aa'); // true
 * ```
 *
 * @param color The foreground color.
 * @param standard The contrast standard to test against.
 * @param background The background color.
 * @returns `true` when the contrast ratio is below the selected standard.
 */
function hasBadContrast(
  color: string,
  standard: 'decorative' | 'readable' | 'aa' | 'aaa' = 'aa',
  background: string = '#fff'
): boolean {
  return getContrast(color, background) < guidelines[standard];
}

export default hasBadContrast;
