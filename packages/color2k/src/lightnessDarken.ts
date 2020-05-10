import parseToHsla from './parseToHsla';
import hsla from './hsla';

function lightnessDarken(color: string, amount: number) {
  const [hue, saturation, lightness, alpha] = parseToHsla(color);
  return hsla(hue, saturation, lightness - amount, alpha);
}

export default lightnessDarken;
