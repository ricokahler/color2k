import getLuminance from './getLuminance';

/**
 * Uses Stevens's Power Law to get value for perceived brightness. Returns a
 * value between 0 and 1.
 */
function getBrightness(color: string): number {
  return Math.pow(getLuminance(color), 0.5);
}

export default getBrightness;
