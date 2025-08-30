import parseToRgba from './parseToRgba';
import rgba from './rgba';

/**
 * Mixes two colors together based on a specified weight (credit to Sass).
 * The function calculates a new color by mixing the two input colors in
 * proportion to the weight and the inverse of the weight. The mixing considers
 * the alpha channel (transparency) of the colors, allowing for the creation of
 * semi-transparent colors if either or both input colors have transparency.
 *
 * A weight of 0.5 mixes the two colors equally, while a weight closer to 0
 * favors `color1`, and a weight closer to 1 favors `color2`.
 *
 * @param color1 The first color to mix
 * @param color2 The second color to mix
 * @param weight A number between 0 and 1 representing the weight of `color2` in the mix
 */
function mix(color1: string, color2: string, weight: number): string {
  const normalize = (n: number, index: number) =>
    // 3rd index is alpha channel which is already normalized
    index === 3 ? n : n / 255;

  const [r1, g1, b1, a1] = parseToRgba(color1).map(normalize);
  const [r2, g2, b2, a2] = parseToRgba(color2).map(normalize);

  // The formula is copied from the original Sass implementation:
  // http://sass-lang.com/documentation/Sass/Script/Functions.html#mix-instance_method
  const alphaDelta = a2 - a1;
  const normalizedWeight = weight * 2 - 1;
  const combinedWeight =
    normalizedWeight * alphaDelta === -1
      ? normalizedWeight
      : normalizedWeight + alphaDelta / (1 + normalizedWeight * alphaDelta);
  const weight2 = (combinedWeight + 1) / 2;
  const weight1 = 1 - weight2;

  const r = (r1 * weight1 + r2 * weight2) * 255;
  const g = (g1 * weight1 + g2 * weight2) * 255;
  const b = (b1 * weight1 + b2 * weight2) * 255;
  const a = a2 * weight + a1 * (1 - weight);

  return rgba(r, g, b, a);
}

export default mix;
