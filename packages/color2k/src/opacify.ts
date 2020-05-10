import transparentize from './transparentize';

function opacify(color: string, amount: number) {
  return transparentize(color, -amount);
}

export default opacify;
