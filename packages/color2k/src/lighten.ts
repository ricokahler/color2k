import darken from './darken';
/**
 * @param amount the amount to darken, given as a decimal between 0 and 1
 */
function lighten(color: string, amount: number) {
  return darken(color, -amount);
}

export default lighten;
