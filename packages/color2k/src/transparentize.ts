import parseToRgba from '@color2k/parse-to-rgba';
import rgba from './rgba';

function transparentize(color: string, amount: number) {
  const [r, g, b, a] = parseToRgba(color);
  return rgba(r, g, b, a - amount);
}

export default transparentize;
