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
 * The standards and the minimum contrast ratio each one needs are `decorative`
 * (1.5), `readable` (3), `aa` (4.5), and `aaa` (7). By default the color is
 * checked against `aa` on a white (`#fff`) background.
 *
 * ```js
 * hasBadContrast('red', 'aa'); // true
 * ```
 *
 * @param color The foreground color.
 * @param standard The contrast standard to test against. Defaults to `aa`.
 * @param background The background color. Defaults to `#fff`.
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
