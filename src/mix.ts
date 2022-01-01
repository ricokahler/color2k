import parseToRgba from './parseToRgba';
import rgba from './rgba';

/**
 * Mixes two colors together. Taken from sass's implementation.
 */
function mix(color1: string, color2: string, weight: number): string {
  if (weight <= 0) return rgba(...parseToRgba(color1));
  if (weight >= 1) return rgba(...parseToRgba(color2));

  const normalize = (n: number, index: number) =>
    // 3rd index is alpha channel which is already normalized
    index === 3 ? n : n / 255;

  const [r1, g1, b1, a1] = parseToRgba(color1).map(normalize);
  const [r2, g2, b2, a2] = parseToRgba(color2).map(normalize);

  // The formula is copied from the original Sass implementation:
  // http://sass-lang.com/documentation/Sass/Script/Functions.html#mix-instance_method
  const alphaDelta = a2 - a1;
  const x = weight * 2 - 1;
  const y = x * alphaDelta === -1 ? x : x + alphaDelta;
  const z = 1 + x * alphaDelta;
  const weight2 = (y / z + 1) / 2.0;
  const weight1 = 1 - weight2;

  const r = (r1 * weight1 + r2 * weight2) * 255;
  const g = (g1 * weight1 + g2 * weight2) * 255;
  const b = (b1 * weight1 + b2 * weight2) * 255;
  const a = a2 * weight + a1 * (1 - weight);

  return rgba(r, g, b, a);
}

export default mix;
