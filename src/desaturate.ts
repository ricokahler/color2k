import parseToHsla from './parseToHsla';
import hsla from './hsla';

function desaturate(color: string, amount: number) {
  const [h, s, l, a] = parseToHsla(color);
  return hsla(h, s - amount, l, a);
}

export default desaturate;
