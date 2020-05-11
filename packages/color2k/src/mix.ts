import parseToRgba from '@color2k/parse-to-rgba';
import rgba from './rgba';

/**
 * Mixes two colors together. Taken from sass's implementation.
 */
function mix(color1: string, color2: string, weight: number): string {
  const normalize = (n: number, index: number) =>
    // 3rd index is alpha channel which is already normalized
    index === 3 ? n : n / 255;

  const [r1, g1, b1, a1] = parseToRgba(color1).map(normalize);
  const [r2, g2, b2, a2] = parseToRgba(color2).map(normalize);

  // The formula is copied from the original Sass implementation:
  // http://sass-lang.com/documentation/Sass/Script/Functions.html#mix-instance_method
  const alphaDelta = a1 - a2;
  const x = weight * 2 - 1;
  const y = x * alphaDelta === -1 ? x : x + alphaDelta;
  const z = 1 + x * alphaDelta;
  const weight1 = (y / z + 1) / 2.0;
  const weight2 = 1 - weight1;

  const r = (r1 * weight1 + r2 * weight2) * 255;
  const g = (g1 * weight1 + g2 * weight2) * 255;
  const b = (b1 * weight1 + b2 * weight2) * 255;
  const a = a1 * weight + a2 * (1 - weight);

  return rgba(r, g, b, a);
}

export default mix;
