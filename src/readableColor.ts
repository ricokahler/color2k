import contrastsWithWhite from './contrastsWithWhite';

/**
 * Returns black or white for best contrast depending on the luminosity of the given color.
 */
export default function readableColor(color: string): string {
  return contrastsWithWhite(color) ? '#fff' : '#000';
}
