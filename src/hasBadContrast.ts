import getContrast from './getContrast';

const guidelines = {
  decorative: 1.5,
  readable: 3,
  aa: 4.5,
  aaa: 7,
};

/**
 * Returns whether or not a color has bad contrast against a background
 * according to a given standard.
 *
 * @param color The input color
 * @param standard A string representing the accessibility standard against which to evaluate the color contrast
 * @param background The background color to test against the input `color`. Defaults to `#fff`
 */
function hasBadContrast(
  color: string,
  standard: 'decorative' | 'readable' | 'aa' | 'aaa' = 'aa',
  background: string = '#fff',
): boolean {
  return getContrast(color, background) < guidelines[standard];
}

export default hasBadContrast;
