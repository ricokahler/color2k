import getLuminance from './getLuminance';

/**
 * Uses Stevens's Power Law to get value for perceived brightness
 */
function brightness(color: string) {
  return Math.pow(getLuminance(color), 0.5);
}

export default brightness;
