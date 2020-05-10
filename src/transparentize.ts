import parseToRgba from '@ricokahler/parse-to-rgba';
import rgba from './rgba';

function transparentize(color: string, amount: number) {
  const [r, g, b, a] = parseToRgba(color);
  return rgba(r, g, b, a / 255 - amount);
}

export default transparentize;
