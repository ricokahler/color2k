import getLuminance from './getLuminance';

/**
 * Uses Stevens's Power Law to get value for perceived brightness
 */
function getBrightness(color: string) {
  return Math.pow(getLuminance(color), 0.5);
}

export default getBrightness;
