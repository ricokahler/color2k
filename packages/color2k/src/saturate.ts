import desaturate from './desaturate';

function saturate(color: string, amount: number) {
  return desaturate(color, -amount);
}

export default saturate;
