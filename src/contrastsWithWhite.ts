import getLuminance from './getLuminance';

function contrastsWithWhite(color: string) {
  return getLuminance(color) <= 0.179;
}

export default contrastsWithWhite;
