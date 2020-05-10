import getLuminance from './getLuminance';

function readableColorIsBlack(color: string) {
  return getLuminance(color) > 0.179;
}

export default readableColorIsBlack;
