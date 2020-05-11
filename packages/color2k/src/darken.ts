import getBrightness from './getBrightness';
import lightnessDarken from './lightnessDarken';

const step = 0.01;

/**
 * Darkens the input color by the given amount using brightness
 *
 * @param amount the amount to darken, given as a decimal between 0 and 1
 */
function darken(color: string, amount: number): string {
  if (amount === 0) return color;

  const originalBrightness = getBrightness(color);
  let currentBrightness = originalBrightness;
  let currentColor = color;

  while (Math.abs(currentBrightness - originalBrightness) < Math.abs(amount)) {
    const direction = amount > 0 ? 1 : -1;
    currentColor = lightnessDarken(currentColor, direction * step);
    currentBrightness = getBrightness(currentColor);
    if (currentBrightness <= 0) return '#000';
    if (currentBrightness >= 1) return '#fff';
  }

  return currentColor;
}

export default darken;
