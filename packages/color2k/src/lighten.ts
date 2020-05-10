import darken from './darken';

function lighten(color: string, amount: number) {
  return darken(color, -amount);
}

export default lighten;
