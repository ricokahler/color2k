import getContrast from './getContrast';

const guidelines = {
  decorative: 1.5,
  readable: 3,
  aa: 4.5,
  aaa: 7,
};

/**
 * Returns whether or not a color has bad contrast according to a given standard
 */
function hasBadContrast(
  color: string,
  standard: 'decorative' | 'readable' | 'aa' | 'aaa' = 'aa'
): boolean {
  return getContrast(color, '#fff') < guidelines[standard];
}

export default hasBadContrast;
