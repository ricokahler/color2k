import parseToHsla from './parseToHsla';
import hsla from './hsla';

function adjustHue(color: string, degree: number) {
  const [h, s, l, a] = parseToHsla(color);
  return hsla(h + degree, s, l, a);
}

export default adjustHue;
