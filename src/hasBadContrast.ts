import getContrast from './getContrast';

const guidelines = {
  decorative: 1.5,
  readable: 3,
  aa: 4.5,
  aaa: 7,
};

/**
 * Returns whether or not a color has bad contrast against 
 * a background according to a given standard.
 * Default background is white
 */
function hasBadContrast(
  color: string,
  standard: 'decorative' | 'readable' | 'aa' | 'aaa' = 'aa',
  background = '#fff'
): boolean {
  return getContrast(color, background) < guidelines[standard];
}

export default hasBadContrast;
